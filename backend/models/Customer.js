module.exports = (sequelize, DataTypes) => {
    const Customer = sequelize.define(
        "Customer",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            phone_no: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            balance: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00,
            },
            category: {
                type: DataTypes.ENUM("engineer", "shop", "other"),
                allowNull: false,
                defaultValue: "other",
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: DataTypes.DATE,
        },
        {
            tableName: "customers",
            timestamps: true,
            // createdAt: "created_at", // DB uses createdAt
            // updatedAt: "updated_at", // DB uses updatedAt
        }
    );

    Customer.associate = (models) => {
        Customer.hasMany(models.Order, {
            foreignKey: "cus_id",
            as: "orders",
        });
        Customer.hasMany(models.CustomerStatement, {
            foreignKey: "cus_id",
            as: "statements",
        });
        Customer.hasMany(models.CallLog, {
            foreignKey: "cus_id",
            as: "callLogs",
        });
    };

    return Customer;
};
