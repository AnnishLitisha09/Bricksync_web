module.exports = (sequelize, DataTypes) => {
    const Invoice = sequelize.define(
        "Invoice",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            invoiceId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            customerNumber: DataTypes.STRING,
            customerPhone: DataTypes.STRING,
            customerAddress: DataTypes.TEXT,
            date: DataTypes.DATE,
            transportMode: {
                type: DataTypes.STRING,
                defaultValue: "ROAD",
            },
            vehicleNumber: DataTypes.STRING,
            dateOfSupply: DataTypes.DATE,
            deliveryPlace: DataTypes.STRING,
            materialName: DataTypes.STRING,
            hsnCode: DataTypes.STRING,
            unit: DataTypes.STRING,
            office: DataTypes.STRING,
            quantity: DataTypes.FLOAT,
            ratePerUnit: DataTypes.FLOAT,
            sgst: DataTypes.FLOAT,
            cgst: DataTypes.FLOAT,
            igst: DataTypes.FLOAT,
            totalAmount: DataTypes.FLOAT,
            roundOff: DataTypes.FLOAT,
            totalInWords: DataTypes.STRING,
            billingName: DataTypes.STRING,
            billingAddress: DataTypes.TEXT,
            billingGstin: DataTypes.STRING,
            billingState: DataTypes.STRING,
            shippingName: DataTypes.STRING,
            shippingAddress: DataTypes.TEXT,
            shippingGstin: DataTypes.STRING,
            shippingState: DataTypes.STRING,
            bankName: DataTypes.STRING,
            accountNo: DataTypes.STRING,
            ifscCode: DataTypes.STRING,
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            pdfPath: DataTypes.STRING,
            filename: DataTypes.STRING,
        },
        {
            tableName: "Invoices",
            timestamps: true,
        }
    );

    return Invoice;
};
