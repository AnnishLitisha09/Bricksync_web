module.exports = (sequelize, DataTypes) => {
    const CustomerStatement = sequelize.define(
        "CustomerStatement",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "statement_id",
            },
            cus_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            bank_type: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            bank_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: DataTypes.DATE,
        },
        {
            tableName: "customer_statements",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    CustomerStatement.associate = (models) => {
        CustomerStatement.belongsTo(models.Customer, {
            foreignKey: "cus_id",
            as: "customer",
        });
        CustomerStatement.belongsTo(models.BankTable, {
            foreignKey: "bank_id",
            as: "bank",
        });
    };

    return CustomerStatement;
};
