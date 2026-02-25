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
}

export interface ParsedPayment {
    date: string;       // DD-MM-YYYY
    orderNumber: string;
    method: string;
    amount: number;
}

export interface ParsedLedger {
    orders: ParsedOrder[];
    payments: ParsedPayment[];
    openingBalance: number;
}

// Tolerance in PDF user-space units to consider two items on the same line
const Y_TOLERANCE = 3;

// Regex patterns (case-insensitive to handle both "Deivery" and "Delivery")
// Delivery: captures date, orderNo, productName, qty, rate, and optionally the credit amount
const DELIVERY_RE =
    /^(\d{2}-\d{2}-\d{4})\s+(\d+)\s+Dei[iv]ery\s*:\s*(.+?)\s+Qty\s*:\s*([\d.]+)\s+\S+\s+@Rate\s*:\s*([\d.]+)(?:\s+([\d.]+))?/i;

// Payment: captures date, orderNo, method, amount.
// Debit column value is at the end; we allow trailing whitespace or end-of-string.
const PAYMENT_RE =
    /^(\d{2}-\d{2}-\d{4})\s+(\d+)\s+Payment By\s*:\s*(.+?)\s+Ref:\s*\*\s+([\d.]+)/i;

// Opening balance
const OPENING_RE =
    /^(\d{2}-\d{2}-\d{4})\s+Opening Balance\s+([\d.]+)/i;

/**
 * Reconstructs logical text rows from pdfjs text items using Y-position grouping.
 * Returns array of row strings, one per visual row on the page.
 */
function buildRowsFromItems(items: any[]): string[] {
    if (!items || items.length === 0) return [];

    // Each item has transform = [scaleX, 0, 0, scaleY, translateX, translateY]
    // translateY (index 5) is the baseline Y position in PDF user space.

    // Group items by Y (rounded to tolerance)
    const groups: Map<number, { x: number; str: string }[]> = new Map();

    for (const item of items) {
        if (!item.str?.trim()) continue;
        const rawY = typeof item.transform?.[5] === "number" ? item.transform[5] : 0;
        const rawX = typeof item.transform?.[4] === "number" ? item.transform[4] : 0;

        // Find an existing group within Y_TOLERANCE
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

    // Sort groups by Y descending (PDF Y axis goes bottom-up, so higher Y = higher on page)
    const sortedYs = Array.from(groups.keys()).sort((a, b) => b - a);

    return sortedYs.map((y) => {
        const row = groups.get(y)!;
        // Sort items within the row by X (left to right)
        row.sort((a, b) => a.x - b.x);
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
        const rows = buildRowsFromItems(content.items as any[]);
        allRows.push(...rows);
    }

    const orderMap: Record<string, ParsedOrder> = {};
    const payments: ParsedPayment[] = [];
    let openingBalance = 0;

    for (const line of allRows) {
        if (!line) continue;

        // Opening balance
        const openMatch = line.match(OPENING_RE);
        if (openMatch) {
            openingBalance = parseFloat(openMatch[2]) || 0;
            continue;
        }

        // Payment
        const payMatch = line.match(PAYMENT_RE);
        if (payMatch) {
            payments.push({
                date: payMatch[1],
                orderNumber: payMatch[2],
                method: (payMatch[3] || "CASH").trim(),
                amount: parseFloat(payMatch[4]) || 0,
            });
            continue;
        }

        // Delivery
        const delMatch = line.match(DELIVERY_RE);
        if (delMatch) {
            const date = delMatch[1];
            const orderNumber = delMatch[2];
            const product = delMatch[3].trim();
            const qty = parseFloat(delMatch[4]) || 0;
            const rate = parseFloat(delMatch[5]) || 0;
            const parsedAmount = parseFloat(delMatch[6] || "0");
            const amount = parsedAmount > 0 ? parsedAmount : qty * rate;

            const key = `${date}-${orderNumber}`;
            if (!orderMap[key]) {
                orderMap[key] = { date, orderNumber, items: [], total: 0 };
            }
            orderMap[key].items.push({ product, qty, rate, amount });
            orderMap[key].total += amount;
        }
    }

    // Sort orders by date
    const toMs = (d: string) => {
        const [dd, mm, yyyy] = d.split("-");
        return new Date(`${yyyy}-${mm}-${dd}`).getTime();
    };

    const orders = Object.values(orderMap).sort((a, b) => toMs(a.date) - toMs(b.date));
    payments.sort((a, b) => toMs(a.date) - toMs(b.date));

    return { orders, payments, openingBalance };
}
