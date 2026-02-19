const db = require('./models');

async function test() {
    try {
        await db.sequelize.authenticate();
        console.log("DB Connected");

        // Try to create a dummy supplier first
        const supplier = await db.MaterialSupplier.create({
            shop_name: "Repro Shop",
            owner_name: "Repro Owner",
            category: "Repro",
            phone_no: "0000000000",
            address: "Repro Address",
            balance: 0
        });

        console.log("Supplier created:", supplier.id);

        const field = { title: 'Vehicle', options: ['1023', '123'] };
        const name = field.title || field.field_name || (typeof field === 'string' ? field : '');

        console.log("Attempting to create field with name:", name);

        const createdField = await db.MaterialSupplierField.create({
            supplier_id: supplier.id,
            field_name: name,
            field_options: field.options || [],
        });

        console.log("Field created successfully:", createdField.id);
        process.exit(0);
    } catch (err) {
        console.error("TEST FAILED:", err);
        process.exit(1);
    }
}

test();
