const axios = require('axios');

async function debug() {
    try {
        const payload = {
            shop_name: "Test Shop",
            owner_name: "Test Owner",
            category: "Retail",
            phone_no: "1234567890",
            address: "Test Address",
            balance: 100,
            additional_fields: [
                { title: "vehicle", options: ["Truck", "Bike"] }
            ]
        };

        const response = await axios.post('http://localhost:3000/api/materials/suppliers', payload, {
            headers: {
                'Content-Type': 'application/json',
                // Assuming no auth needed for this specific test or user can provide token
                // 'Authorization': 'Bearer ...' 
            }
        });

        console.log("Success:", response.data);
    } catch (error) {
        if (error.response) {
            console.error("Error Status:", error.response.status);
            console.error("Error Data:", error.response.data);
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

debug();
