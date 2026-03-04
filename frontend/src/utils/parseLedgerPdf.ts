/**
 * Parses the M.ASWATH HOLLOW BRICKS ledger PDF format.
 *
 * Key challenge: pdfjs returns individual positioned text fragments.
 * We reconstruct logical rows by grouping fragments with the same Y position,
 * then sort each row's fragments left-to-right by X position, then join with spaces.
 *
 * Row format (delivery):
 *   DD-MM-YYYY  NNNNN  Deivery : ITEM  Qty : N.NNN unit @Rate : R.RR  CREDIT
 *
 * Row format (payment):
 *   DD-MM-YYYY  NNNNN  Payment By : CASH Ref: *  DEBIT_AMOUNT
 *
 * Rows with the same date + order number are grouped into one order.
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
    date: string;       // DD-MM-YYYY
    orderNumber: string;
    items: ParsedItem[];
    total: number;
    originalIndex?: number;
}

export interface ParsedPayment {
    date: string;       // DD-MM-YYYY
    orderNumber: string;
    method: string;
    amount: number;
    originalIndex?: number;
}

export interface ParsedLedger {
    orders: ParsedOrder[];
    payments: ParsedPayment[];
    openingBalance: number;
    customerName: string; // Extracted from PDF header e.g. "AATHI & CO"
}

// Tolerance in PDF user-space units to consider two items on the same line
const Y_TOLERANCE = 3;

// Cleaning helper for numbers (handles spaces like "2 580.00" and commas)
function cleanNumber(val: string | undefined): number {
    if (!val) return 0;
    const cleaned = val.replace(/[,\s]/g, "");
    return parseFloat(cleaned) || 0;
}

// Flexible regex for keywords
// De[li]*[iv]ery handles "Delivery", "Deivery", "Delivary", etc.
// We use non-greedy (.+?) followed by a digit boundary to prevent "glue" of columns.
const DELIVERY_RE = /(\d{2}[-/]\d{2}[-/]\d{4})\s+(\d+)\s+De[li]*[iv]ery\s*:\s*(.+?)\s+Qty\s*:\s*([\d\s,.]+?)\s+\S+\s+@Rate\s*:\s*([\d\s,.]+?)(?:\s+([\d\s,.]+))?$/gi;

const PAYMENT_RE = /(\d{2}[-/]\d{2}[-/]\d{4})\s+(\d+)\s+Payment By\s*:\s*(.+?)\s+Ref:\s*\*\s+([\d\s,.]+)$/gi;

const OPENING_RE = /(\d{2}[-/]\d{2}[-/]\d{4})\s+Opening Balance\s+([\d\s,.]+)$/gi;

/**
 * Reconstructs logical text rows from pdfjs text items using Y-position grouping.
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
        if (!found) {
            groups.set(rawY, [{ x: rawX, str: item.str }]);
        }
    }

    const sortedYs = Array.from(groups.keys()).sort((a, b) => b - a);

    return sortedYs.map((y) => {
        const row = groups.get(y)!;
        row.sort((a, b) => a.x - b.x);
        // Important: replace any masked dates that got stuck to numbers
        return row.map((r) => r.str).join(" ").replace(/\s{2,}/g, " ").trim();
    });
}

export async function parseLedgerPdf(file: File): Promise<ParsedLedger> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const allRows: string[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        allRows.push(...buildRowsFromItems(content.items as any[]));
    }

    const orderMap: Record<string, ParsedOrder & { originalIndex: number }> = {};
    const payments: (ParsedPayment & { originalIndex: number })[] = [];
    let openingBalance = 0;
    let rowIndex = 0;
    let customerName = "";

    // Extract customer name from the first page header
    // The header row typically looks like: "CUSTOMER NAME - Ledger  Period : ..."
    // We look for the pattern "...- Ledger" in the first few rows.
    const LEDGER_HEADER_RE = /^(.+?)\s*-\s*Ledger\b/i;
    for (const row of allRows.slice(0, 15)) {
        const hm = row.match(LEDGER_HEADER_RE);
        if (hm) {
            customerName = hm[1].trim();
            break;
        }
    }

    for (const line of allRows) {
        if (!line) continue;
        rowIndex++;

        // 1. Opening balance
        let match;
        OPENING_RE.lastIndex = 0;
        while ((match = OPENING_RE.exec(line)) !== null) {
            openingBalance = cleanNumber(match[2]);
        }

        // 2. Payments
        PAYMENT_RE.lastIndex = 0;
        while ((match = PAYMENT_RE.exec(line)) !== null) {
            payments.push({
                date: match[1].replace(/\//g, "-"),
                orderNumber: match[2],
                method: (match[3] || "CASH").trim(),
                amount: cleanNumber(match[4]),
                originalIndex: rowIndex
            });
        }

        // 3. Deliveries
        DELIVERY_RE.lastIndex = 0;
        while ((match = DELIVERY_RE.exec(line)) !== null) {
            const date = match[1].replace(/\//g, "-");
            const orderNumber = match[2];
            const product = match[3].trim();
            const qty = cleanNumber(match[4]);
            let rate = cleanNumber(match[5]);
            const amountInLine = cleanNumber(match[6]);
            const amount = amountInLine > 0 ? amountInLine : qty * rate;

            const key = `${date}-${orderNumber}`;

            // Correction logic: if qty * rate != amount, trust amount and recalculate rate
            if (qty > 0) {
                if (Math.abs(qty * rate - amount) > 0.01) {
                    rate = amount / qty;
                }
            } else if (amount > 0) {
                // Handle lump sum entries (like adjustments or service charges)
                // If qty is 0 but there's an amount, set qty to 1 and rate to amount
                // to maintain system compatibility.
                const adjustedQty = 1;
                const adjustedRate = amount;
                orderMap[key] = orderMap[key] || { date, orderNumber, items: [], total: 0, originalIndex: rowIndex };
                orderMap[key].items.push({ product, qty: adjustedQty, rate: adjustedRate, amount });
                orderMap[key].total += amount;
                continue; // Skip the default push below
            }
            if (!orderMap[key]) {
                orderMap[key] = { date, orderNumber, items: [], total: 0, originalIndex: rowIndex };
            }
            orderMap[key].items.push({ product, qty, rate, amount });
            orderMap[key].total += amount;
        }
    }

    const toMs = (d: string) => {
        const [dd, mm, yyyy] = d.split("-");
        return new Date(`${yyyy}-${mm}-${dd}`).getTime();
    };

    // Sort stably: primary = date, secondary = originalIndex (order in PDF)
    const orders = Object.values(orderMap).sort((a, b) => {
        const dateDiff = toMs(a.date) - toMs(b.date);
        return dateDiff !== 0 ? dateDiff : a.originalIndex - b.originalIndex;
    });

    payments.sort((a, b) => {
        const dateDiff = toMs(a.date) - toMs(b.date);
        return dateDiff !== 0 ? dateDiff : a.originalIndex - b.originalIndex;
    });

    return { orders, payments, openingBalance, customerName };
}

