module.exports = (sequelize, DataTypes) => {
    const OrderEmployee = sequelize.define(
        "OrderEmployee",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            order_item_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            employee_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM("driver", "loader"),
                allowNull: false,
            },
        },
        {
            tableName: "order_employees",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    OrderEmployee.associate = (models) => {
        OrderEmployee.belongsTo(models.OrderItem, {
            foreignKey: "order_item_id",
            as: "orderItem",
        });
        OrderEmployee.belongsTo(models.User, {
            foreignKey: "employee_id",
            as: "employee",
        });
    };

    return OrderEmployee;
};
