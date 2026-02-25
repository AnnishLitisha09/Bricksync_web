module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define(
        "Order",
        {
            order_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            cus_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            transport_charge: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: DataTypes.DATE,
        },
        {
            tableName: "orders",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    Order.associate = (models) => {
        Order.belongsTo(models.Customer, {
            foreignKey: "cus_id",
            as: "customer",
        });
        Order.hasMany(models.OrderItem, {
            foreignKey: "order_id",
            as: "items",
        });
    };

    return Order;
};
