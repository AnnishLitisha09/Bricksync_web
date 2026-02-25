module.exports = (sequelize, DataTypes) => {
    const Notepad = sequelize.define(
        "Notepad",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            verifiedId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            title: DataTypes.STRING,
            address: DataTypes.TEXT,
            phone: DataTypes.STRING,
            email: DataTypes.STRING,
            website: DataTypes.STRING,
            notes: DataTypes.TEXT,
            companySignature: DataTypes.STRING,
            pdfPath: DataTypes.STRING,
            filename: DataTypes.STRING,
        },
        {
            tableName: "Notepads",
            timestamps: true,
        }
    );

    return Notepad;
};
