module.exports = (sequelize, DataTypes) => {
    const MaterialStatement = sequelize.define(
        "MaterialStatement",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            supplier_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            bank_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            payment_mode: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
            },
        },
        {
            tableName: "material_statements",
            timestamps: true,
        }
    );

    MaterialStatement.associate = (models) => {
        MaterialStatement.belongsTo(models.MaterialSupplier, {
            foreignKey: "supplier_id",
            as: "supplier",
        });
        MaterialStatement.belongsTo(models.BankTable, {
            foreignKey: "bank_id",
            as: "bank",
        });
    };

    return MaterialStatement;
};
