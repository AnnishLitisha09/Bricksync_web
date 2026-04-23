const Groq = require("groq-sdk");
const fs = require("fs");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

exports.extractEntry = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const { path } = req.file;

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
 text: `Analyze this handwritten daily entry notebook image and extract the following details into JSON format.
 
 ### Instructions:
 1. **vehicle_number**: Look for the vehicle registration number (e.g., "TN 47 AR 4677") usually at the top.
 2. **driver_name**: Look for the driver's name (often near the top). Translate Tamil names to English.
 3. **entries**: This is a list or table of trips/deliveries. For each entry, extract:
    - **sl_no**: Serial number (1, 2, 3...).
    - **raw_customer**: The customer or party name. Translate Tamil names to English.
    - **place_of_delivery**: The destination or location. Translate Tamil names to English.
    - **material**: The type of material. 
      - Example: If text is "m-sand 1 unit", material is "M-Sand" and qty is "1 Unit".
      - Example: If text is "6\"mold-25", material is "6\" Mold" and qty is "25".
      - Correctly split the material name and the quantity.
    - **qty**: The quantity part (e.g., "1 Unit", "25", "5000").
 4. **Exclusions**: 
    - **IMPORTANT**: DO NOT extract or consider any data written in **RED INK**. Only process entries in blue or black ink.
 
 Return ONLY a perfectly valid JSON object with this structure:
 {
   "vehicle_number": { "raw": "...", "matched": null, "status": "unverified" },
   "driver_name": { "raw": "...", "matched": null, "status": "unverified" },
   "entries": [
     {
       "sl_no": 1,
       "raw_customer": "...",
       "matched_customer": null,
       "customer_status": "unverified",
       "place_of_delivery": "...",
       "material": "...",
       "qty": "..."
     }
   ]
 }
 
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
            temperature: 0,
        });

        const extraction = JSON.parse(groqResponse.choices[0].message.content);

        // Cleanup temp file
        if (fs.existsSync(path)) fs.unlinkSync(path);

        res.json({ success: true, data: extraction });
    } catch (err) {
        console.error("TodaysEntry OCR Error:", err);
        if (fs.existsSync(path)) fs.unlinkSync(path);
        res.status(500).json({ success: false, message: `OCR processing failed. ${err.message}` });
    }
};
