const { ollama } = require("ollama");
const fs = require("fs");

exports.extractData = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const { path } = req.file;

    try {
        const response = await ollama.chat({
            model: "llava",
            messages: [
                {
                    role: "user",
                    content: `Extract the following data from this image:
- vehicle_number
- unit (quantity)
- driver_name
- material_name

Return ONLY a JSON object with these keys. If any information is missing or unclear, set the value to null. The material name might be in Tamil or English (e.g., jelly, m-sand, etc.).`,
                    images: [path],
                },
            ],
            format: "json",
        });

        const extraction = JSON.parse(response.message.content);

        // Cleanup temp file
        if (fs.existsSync(path)) fs.unlinkSync(path);

        res.json(extraction);
    } catch (err) {
        console.error("Ollama OCR Error:", err);
        if (fs.existsSync(path)) fs.unlinkSync(path);
        res.status(500).json({ success: false, message: "OCR processing failed. Ensure Ollama is running and llava is pulled." });
    }
};

