import * as pdfjsLib from "pdfjs-dist";

// Vite-compatible worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
).toString();

export interface ParsedCustomer {
    name: string;
    phone_no: string;
    email: string;
    address: string;
    balance: number;
    category: string;
}

const Y_TOLERANCE = 3;

/**
 * Parses the M.ASWATH HOLLOW BRICKS customer consolidated outstanding PDF format.
 */
export async function parseCustomerPdf(file: File): Promise<ParsedCustomer[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const allRows: string[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        allRows.push(...buildRowsFromItems(content.items as any[]));
    }

    const customers: ParsedCustomer[] = [];

    // The logic: 
    // Rows typically start with a Sr. number.
    // Example: "1  AASARI ARUMUGAM  0.00  ..."
    // or "2  AATHI & CO  99528 17499  ..."

    // We look for rows that start with a number followed by name.
    // A simplified regex based on the image structure:
    // Sr (Number) | Supplier (Text) | Mobile (Optional Numbers) | Opening | Debit | Credit | Balance

    for (const line of allRows) {
        // Regex to match Sr. No at start, then capturing the name until we hit either a phone number or a numeric balance (Opening column).
        // Balance columns are usually decimal numbers.
        const match = line.match(/^(\d+)\s+(.+?)(?:\s+([\d\s,]+))?\s+[\d\s,.]+\s+[\d\s,.]+\s+[\d\s,.]+\s+[\d\s,.]+$/i);

        if (match) {
            const rawName = match[2].trim();
            // User requirement: phone is 3rd column or missing. 
            // The regex above tries to capture digits in group 3.
            let phone = match[3] ? match[3].replace(/\s/g, "") : "";

            // Clean phone: if it's junk or just spaces, mark as not provided
            if (!phone || !/^\d+/.test(phone)) {
                phone = "Not provided";
            }

            // User requirement: email = cleanedName + @gmail.com
            // Clean name: "aathi (tituppur)" -> "aathitiruppur"
            const cleanedName = rawName
                .toLowerCase()
                .replace(/\(.*?\)/g, (m) => m.replace(/\s/g, "")) // remove spaces inside parentheses
                .replace(/\(|\)/g, "") // remove parentheses
                .replace(/\s+/g, ""); // remove all other spaces

            const email = `${cleanedName}@gmail.com`;

            customers.push({
                name: rawName,
                phone_no: phone,
                email: email,
                address: "Tirupur", // Default per user requirement
                balance: 0, // Default per user requirement
                category: "other"
            });
        }
    }

    return customers;
}

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
        return row.map((r) => r.str).join(" ").replace(/\s{2,}/g, " ").trim();
    });
}
