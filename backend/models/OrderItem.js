module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define(
        "OrderItem",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            product: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            material_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            office_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00,
            },
            vehicle_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            tableName: "order_items",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    OrderItem.associate = (models) => {
        OrderItem.belongsTo(models.Order, {
            foreignKey: "order_id",
            as: "order",
        });
        OrderItem.belongsTo(models.Office, {
            foreignKey: "office_id",
            as: "office",
        });
        OrderItem.belongsTo(models.Product, {
            foreignKey: "material_id",
            as: "material",
        });
        OrderItem.belongsTo(models.Vehicle, {
            foreignKey: "vehicle_id",
            as: "vehicle",
        });
        OrderItem.hasMany(models.OrderEmployee, {
            foreignKey: "order_item_id",
            as: "orderEmployees",
        });
    };

    return OrderItem;
};
