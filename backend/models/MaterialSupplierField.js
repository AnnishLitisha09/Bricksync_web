module.exports = (sequelize, DataTypes) => {
    const MaterialSupplierField = sequelize.define(
        "MaterialSupplierField",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            supplier_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            field_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            field_options: {
                type: DataTypes.TEXT,
                allowNull: true,
                get() {
                    const rawValue = this.getDataValue('field_options');
                    return rawValue ? JSON.parse(rawValue) : [];
                }
            },
        },
        {
            tableName: "material_supplier_fields",
            timestamps: true,
        }
    );

    MaterialSupplierField.associate = (models) => {
        MaterialSupplierField.belongsTo(models.MaterialSupplier, {
            foreignKey: "supplier_id",
            as: "supplier",
        });
    };

    return MaterialSupplierField;
};
