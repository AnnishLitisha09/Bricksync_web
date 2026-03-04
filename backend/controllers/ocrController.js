const Groq = require("groq-sdk");
const fs = require("fs");

const db = require("../models");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Helper for string similarity (Dice's Coefficient)
const getSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const s1 = str1.toLowerCase().replace(/\s/g, "");
    const s2 = str2.toLowerCase().replace(/\s/g, "");
    if (s1 === s2) return 1;
    if (s1.length < 2 || s2.length < 2) return 0;

    const bigrams1 = new Set();
    for (let i = 0; i < s1.length - 1; i++) bigrams1.add(s1.substring(i, i + 2));
    const bigrams2 = new Set();
    for (let i = 0; i < s2.length - 1; i++) bigrams2.add(s2.substring(i, i + 2));

    let intersect = 0;
    for (const b of bigrams1) if (bigrams2.has(b)) intersect++;
    return (2 * intersect) / (bigrams1.size + bigrams2.size);
};

exports.extractData = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const { path } = req.file;
    const { office_id } = req.body;

    try {
        // Read file and convert to base64
        const imageBuffer = fs.readFileSync(path);
        const base64Image = imageBuffer.toString("base64");

        const groqResponse = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this receipt image (likely in Tamil and English) and extract the following details into JSON format. 
 
 ### Instructions:
 1. **vehicle_number**: Look for the vehicle registration number (e.g., "TN 47 AR 4677"). Ensure it captures the full registration code.
 2. **unit**: Look for the Tamil label "அளவு" or labels like "Unit", "Qty", or "Amount". If the ticket shows "7" in this context, the value must be Exactly "7".
 3. **material_name**: Look for the material type. If it says "1/4 ஜல்லி", return "1/4 Jalli". If it says "M-Sand" or "M. SAND", return "M. SAND".
 4. **driver_name**: Look for the driver's name (often near "ஓட்டுநர்"). If the name is in Tamil (e.g., "குமார்"), you MUST translate it to the English equivalent (e.g., "Kumar").
 5. **date**: Look for the date of the receipt (e.g., "03/03/2026"). Format as YYYY-MM-DD if possible, otherwise return as seen.
 
 Return ONLY a perfectly valid JSON object with these keys: "vehicle_number", "unit", "driver_name", "material_name", "date". 
 Ensure ALL values are in English text. If a value is missing, use null.`,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${req.file.mimetype};base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
        });

        const extraction = JSON.parse(groqResponse.choices[0].message.content);

        // --- DATABASE MATCHING LOGIC ---

        let matchedData = { ...extraction };

        // 1. Fetch Supplier "TBK curser" Fields (for Vehicle & Driver)
        const supplier = await db.MaterialSupplier.findOne({
            where: { shop_name: "TBK curser" },
            include: [{ model: db.MaterialSupplierField, as: "additionalFields" }]
        });

        if (supplier) {
            const vehicleField = supplier.additionalFields?.find(f => f.field_name.toLowerCase().includes("vechile"));
            const driverField = supplier.additionalFields?.find(f => f.field_name.toLowerCase().includes("driver"));

            // Match Vehicle Number
            if (extraction.vehicle_number && vehicleField && Array.isArray(vehicleField.field_options)) {
                let bestMatch = null;
                let highestScore = 0;
                vehicleField.field_options.forEach(opt => {
                    const score = getSimilarity(extraction.vehicle_number, opt);
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = opt;
                    }
                });
                if (highestScore > 0.90) matchedData.vehicle_number = bestMatch;
            }

            // Match Driver Name
            if (extraction.driver_name && driverField && Array.isArray(driverField.field_options)) {
                let bestMatch = null;
                let highestScore = 0;
                driverField.field_options.forEach(opt => {
                    const score = getSimilarity(extraction.driver_name, opt);
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = opt;
                    }
                });
                if (highestScore > 0.90) {
                    matchedData.driver_name = bestMatch;
                } else {
                    matchedData.driver_name = null; // As requested, null if no match
                }
            } else {
                matchedData.driver_name = null; // No options, no match
            }
        }

        // 2. Fetch Materials based on office_id
        if (office_id) {
            const stocks = await db.ProductStock.findAll({
                where: { office_id: Number(office_id) },
                include: [{ model: db.Product, as: "product" }]
            });

            if (extraction.material_name) {
                if (stocks.length === 0) {
                    matchedData.material_name = "Material not found";
                } else {
                    let bestMatch = null;
                    let highestScore = 0;

                    // Normalize extraction for comparison
                    const normalizedExtraction = extraction.material_name.toLowerCase().replace(/\s/g, "").replace(/jalli/g, "chips");

                    stocks.forEach(s => {
                        const pName = s.product?.product_name;
                        if (pName) {
                            const normalizedPName = pName.toLowerCase().replace(/\s/g, "").replace(/jalli/g, "chips");
                            const score = getSimilarity(normalizedExtraction, normalizedPName);

                            if (score > highestScore) {
                                highestScore = score;
                                bestMatch = pName;
                            }
                        }
                    });

                    // With normalization, "1/4 jalli" and "1/4 chips" will be high similarity
                    if (highestScore > 0.40) {
                        matchedData.material_name = bestMatch;
                    } else {
                        matchedData.material_name = "Material not found";
                    }
                }
            }
        }

        // Cleanup temp file
        if (fs.existsSync(path)) fs.unlinkSync(path);

        res.json(matchedData);
    } catch (err) {
        console.error("Groq OCR Error:", err);
        if (fs.existsSync(path)) fs.unlinkSync(path);
        res.status(500).json({ success: false, message: `OCR processing failed. ${err.message}` });
    }
};

exports.extractDriverTrips = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const { path } = req.file;

    try {
        const imageBuffer = fs.readFileSync(path);
        const base64Image = imageBuffer.toString("base64");

        const groqResponse = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this handwritten driver trip log/notebook image and extract the trip details into JSON format.
 
 ### Log Structure:
 - **Date**: Usually at the top right (e.g., "03/03/2026").
 - **Header**: Often contains Vehicle Number and Driver Name (e.g., "TN 37 CR 1288 (Mohan)").
 - **Entries**: Numbered list (1, 2, 3...) containing:
    - **Route**: From... To... (e.g., "Pandiyan Nagar To Settipurpalayam").
    - **Customer/Party**: Often in parentheses or after the route (e.g., "Aathi & Co").
    - **Material & Qty**: Look for material types like "Msand", "Psand", "Jalli" and quantities like "1U", "1/2 unit", "50 bags".
    - **DC Number**: Preceded by "DC:" (e.g., "DC: 679").
 
 ### Translation:
 - Translate all Tamil names, locations, and labels to English.
 
 Return a JSON object with:
 {
   "date": "Extracted Date",
   "vehicle_number": "Main Vehicle Number",
   "driver_name": "Main Driver Name",
   "trips": [
     {
       "from": "Origin Location",
       "to": "Destination Location",
       "customer_name": "Customer or Party Name",
       "material_name": "Extracted Material",
       "qty": "Number/Unit of Quantity",
       "dc_number": "DC Number String"
     }
   ]
 }
 
 Ensure the output is ONLY a valid JSON object. If a field is missing, use null.`,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${req.file.mimetype};base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
        });

        const tripData = JSON.parse(groqResponse.choices[0].message.content);

        // Cleanup temp file
        if (fs.existsSync(path)) fs.unlinkSync(path);

        res.json(tripData);
    } catch (err) {
        console.error("Trip Extraction Error:", err);
        if (fs.existsSync(path)) fs.unlinkSync(path);
        res.status(500).json({ success: false, message: `Trip processing failed. ${err.message}` });
    }
};





