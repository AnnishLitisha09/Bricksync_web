module.exports = (sequelize, DataTypes) => {
    const ProductionEmployee = sequelize.define(
        "ProductionEmployee",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            production_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            employee_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: DataTypes.DATE,
        },
        {
            tableName: "production_employees",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: false,
        }
    );

    ProductionEmployee.associate = (models) => {
        ProductionEmployee.belongsTo(models.ProductionLog, {
            foreignKey: "production_id",
            as: "production",
        });
        ProductionEmployee.belongsTo(models.User, {
            foreignKey: "employee_id",
            as: "employee",
        });

    };

    return ProductionEmployee;
};
