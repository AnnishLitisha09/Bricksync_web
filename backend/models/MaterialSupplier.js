module.exports = (sequelize, DataTypes) => {
    const MaterialSupplier = sequelize.define(
        "MaterialSupplier",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            shop_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            owner_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            category: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            balance: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0,
            },
            phone_no: {
                type: DataTypes.STRING(15),
                allowNull: false,
            },
            address: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: "material_suppliers",
            timestamps: true,
        }
    );

    MaterialSupplier.associate = (models) => {
        MaterialSupplier.hasMany(models.MaterialSupplierField, {
            foreignKey: "supplier_id",
            as: "additionalFields",
        });
        MaterialSupplier.hasMany(models.MaterialEntry, {
            foreignKey: "supplier_id",
            as: "entries",
        });
        MaterialSupplier.hasMany(models.MaterialStatement, {
            foreignKey: "supplier_id",
            as: "statements",
        });
    };

    return MaterialSupplier;
};
