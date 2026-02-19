module.exports = (sequelize, DataTypes) => {
    const MaterialEntry = sequelize.define(
        "MaterialEntry",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            supplier_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            office_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            units: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
        },
        {
            tableName: "material_entries",
            timestamps: true,
        }
    );

    MaterialEntry.associate = (models) => {
        MaterialEntry.belongsTo(models.MaterialSupplier, {
            foreignKey: "supplier_id",
            as: "supplier",
        });
        MaterialEntry.belongsTo(models.Product, {
            foreignKey: "product_id",
            as: "product",
        });
        MaterialEntry.belongsTo(models.Office, {
            foreignKey: "office_id",
            as: "office",
        });
        MaterialEntry.hasMany(models.MaterialEntryField, {
            foreignKey: "entry_id",
            as: "fields",
        });
    };

    return MaterialEntry;
};
