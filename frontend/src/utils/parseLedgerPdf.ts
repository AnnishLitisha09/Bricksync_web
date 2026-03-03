/**
 * Parses the M.ASWATH HOLLOW BRICKS ledger PDF format.
 */

import * as pdfjsLib from "pdfjs-dist";

// Vite-compatible worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
).toString();

export interface ParsedItem {
    product: string;
    qty: number;
    rate: number;
    amount: number;
}

export interface ParsedOrder {
    date: string;
    orderNumber: string;
    items: ParsedItem[];
    total: number;
    originalIndex?: number;
}

export interface ParsedPayment {
    date: string;
    orderNumber: string;
    method: string;
    amount: number;
    originalIndex?: number;
}

export interface ParsedLedger {
    orders: ParsedOrder[];
    payments: ParsedPayment[];
    openingBalance: number;
}

const Y_TOLERANCE = 2;

function cleanNumber(val: string | undefined): number {
    if (!val) return 0;
    const cleaned = val.replace(/[₹,\s\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, "").trim();
    // Use a precise regex to capture only the first valid number block (with at most 2 decimal places)
    // This stops it from "eating" the next record's ID or date
    const match = cleaned.match(/^-?\d+(\.\d{1,2})?/);
    return match ? parseFloat(match[0]) : 0;
}

/**
 * Reconstructs rows precisely by coordinate grouping.
 */
function buildRowsFromItems(items: any[]): string[] {
    if (!items || items.length === 0) return [];
    const groups: Map<number, { x: number; str: string }[]> = new Map();
    for (const item of items) {
        if (!item.str?.trim()) continue;
        const rawY = typeof item.transform?.[5] === "number" ? item.transform[5] : 0;
        const rawX = typeof item.transform?.[4] === "number" ? item.transform[4] : 0;
        let found = false;
        for (const [gy] of groups) {
            if (Math.abs(rawY - gy) <= Y_TOLERANCE) {
                groups.get(gy)!.push({ x: rawX, str: item.str });
                found = true;
                break;
            }
        }
        if (!found) groups.set(rawY, [{ x: rawX, str: item.str }]);
    }
    const sortedYs = Array.from(groups.keys()).sort((a, b) => b - a);
    return sortedYs.map((y) => {
        const row = groups.get(y)!;
        row.sort((a, b) => a.x - b.x);
        let rowStr = "";
        for (let i = 0; i < row.length; i++) {
            if (i > 0) {
                const gap = row[i].x - (row[i - 1].x + (row[i - 1].str.length * 4));
                rowStr += gap > 20 ? "    " : " ";
            }
            rowStr += row[i].str;
        }
        return rowStr.trim();
    });
}

export async function parseLedgerPdf(file: File): Promise<ParsedLedger> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const allRowsRaw: string[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        allRowsRaw.push(...buildRowsFromItems(content.items as any[]));
    }

    // Split glued records where two Date+ID pairs appear on one physical line
    const allRows: string[] = [];
    const DATE_RECORD_GLUE_RE = /(\d{2}[-/]\d{2}[-/]\d{4})\s+(\d+)\s+/g;
    for (const r of allRowsRaw) {
        let line = r.trim().replace(/(\d{2}[-/]\d{2}[-/]\d{4})/g, " $1 ");
        line = line.replace(/\s+/g, " ");
        const matches = Array.from(line.matchAll(DATE_RECORD_GLUE_RE));
        if (matches.length > 1) {
            let lastIdx = 0;
            for (let j = 1; j < matches.length; j++) {
                allRows.push(line.substring(lastIdx, matches[j].index).trim());
                lastIdx = matches[j].index!;
            }
            allRows.push(line.substring(lastIdx).trim());
        } else {
            allRows.push(line);
        }
    }

    const orderMap: Record<string, ParsedOrder & { originalIndex: number }> = {};
    const payments: (ParsedPayment & { originalIndex: number })[] = [];
    let openingBalance = 0;
    let lastDate = "";
    let lastID = "";

    const DATE_ID_RE = /^(\d{2}[-/]\d{2}[-/]\d{4})\s+(\d+)\s+/;

    for (let i = 0; i < allRows.length; i++) {
        let line = allRows[i].trim();
        if (!line) continue;

        // NOISE FILTER
        if (/TOTAL|BALANCE|Opening Balance|Page \d+|of \d+|Ledger Period|Debit|Credit|AATHI & CO|M\.ASWATH/i.test(line)) {
            if (/Opening Balance/i.test(line)) {
                const nums = line.match(/-?[\d,.\s₹]+/g);
                if (nums) openingBalance = cleanNumber(nums[nums.length - 1]);
            }
            continue;
        }

        let date = "";
        let id = "";
        let particulars = "";

        const recordMatch = line.match(DATE_ID_RE);
        if (recordMatch) {
            date = recordMatch[1].replace(/\//g, "-");
            id = recordMatch[2];
            particulars = line.replace(DATE_ID_RE, "").trim();
            lastDate = date;
            lastID = id;
        } else if (lastDate && lastID) {
            // Continuation line
            if (/Qty|Rate|Deivery|unit|NOS|load|pack|bags?|PCS|kg|x\s*|[-₹\d,.]+/i.test(line)) {
                date = lastDate;
                id = lastID;
                particulars = line;
            } else continue;
        } else continue;

        // CLASSIFY
        if (/Payment|Paid|Received|Receipt|By\s*:\s*(?:CASH|BANK)/i.test(particulars)) {
            const numbers = particulars.match(/(-?[\d,.\s₹]+)/g);
            if (numbers) {
                const amount = cleanNumber(numbers[numbers.length - 1]);
                if (amount > 0) {
                    const method = particulars.match(/Payment\s*(?:By|—|:)\s*([^Ref*]+)/i)?.[1] || "CASH";
                    payments.push({ date, orderNumber: id, method: method.trim().substring(0, 50), amount, originalIndex: i });
                }
            }
        } else {
            const items: ParsedItem[] = [];

            // GLOBAL MATCHING: Extract all items in the particulars line
            // Pattern A: Qty Pattern
            const matchesA = particulars.matchAll(/(.+?)\s+Qty\s*:\s*([\d,.\s]+?)\s+(?:unit|NOS|load|PCS|bags?|pack|NOS|kg|liter)\s+@Rate\s*:\s*([\d,.\s]+?)\s+([\d,.\s]+)/gi);
            for (const m of matchesA) {
                const product = m[1].replace(/De[li]*[iv]ery\s*[:—-]\s*/i, "").trim().substring(0, 100);
                let qty = cleanNumber(m[2]);
                let rate = cleanNumber(m[3]);
                const amount = cleanNumber(m[4]);

                // ROOT CAUSE FIX: Even if qty/rate are 0, use the amount. 
                // If amount exists, the transaction must be counted.
                if (amount > 0) {
                    if (qty === 0) qty = 1;
                    if (rate === 0) rate = amount / qty;
                    items.push({ product, qty, rate, amount });
                }
            }

            // Pattern B: x Shorthand (Global)
            if (items.length === 0) {
                const matchesX = particulars.matchAll(/(.+?)x\s*([\d,.\s]+?)\s*@(?:₹|Rate\s*:|)\s*([\d,.\s]+)/gi);
                for (const m of matchesX) {
                    const product = m[1].replace(/De[li]*[iv]ery\s*[:—-]\s*/i, "").trim().substring(0, 100);
                    const qty = cleanNumber(m[2]) || 1;
                    const rate = cleanNumber(m[3]);
                    const amount = qty * rate;
                    if (amount > 0) items.push({ product, qty, rate, amount });
                }
            }

            // Fallback: If no explicit patterns but looks like a material row with a final amount
            if (items.length === 0) {
                const lastNumMatch = particulars.match(/(-?[\d,.\s₹]+)$/);
                if (lastNumMatch) {
                    const amount = cleanNumber(lastNumMatch[0]);
                    if (amount > 0) {
                        const product = particulars.replace(lastNumMatch[0], "").replace(/De[li]*[iv]ery\s*[:—-]\s*/i, "").trim();
                        items.push({ product: product.substring(0, 100) || "Material Delivery", qty: 1, rate: amount, amount });
                    }
                }
            }

            if (items.length > 0) {
                const key = `${date}-${id}`;
                if (!orderMap[key]) orderMap[key] = { date, orderNumber: id, items: [], total: 0, originalIndex: i };
                items.forEach(it => {
                    orderMap[key].items.push(it);
                    orderMap[key].total += it.amount;
                });
            }
        }
    }

    const toMs = (d: string) => {
        const [dd, mm, yyyy] = d.split("-");
        return new Date(`${yyyy}-${mm}-${dd}`).getTime();
    };

    const sortedOrders = Object.values(orderMap).sort((a, b) => {
        const dateDiff = toMs(a.date) - toMs(b.date);
        return dateDiff !== 0 ? dateDiff : (a.originalIndex ?? 0) - (b.originalIndex ?? 0);
    });

    const sortedPayments = payments.sort((a, b) => {
        const dateDiff = toMs(a.date) - toMs(b.date);
        return dateDiff !== 0 ? dateDiff : (a.originalIndex ?? 0) - (b.originalIndex ?? 0);
    });

    return { orders: sortedOrders, payments: sortedPayments, openingBalance };
}
