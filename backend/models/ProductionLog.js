module.exports = (sequelize, DataTypes) => {
    const ProductionLog = sequelize.define(
        "ProductionLog",
        {
            production_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            office_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            unit_produced: DataTypes.DECIMAL(10, 2),
            cement_used: DataTypes.DECIMAL(10, 2),
            production_date: DataTypes.DATEONLY,
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: DataTypes.DATE,
        },
        {
            tableName: "production_log",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    ProductionLog.associate = (models) => {
        ProductionLog.belongsTo(models.Office, {
            foreignKey: "office_id",
            as: "office",
        });
        ProductionLog.belongsTo(models.Product, {
            foreignKey: "product_id",
            as: "product",
        });
        ProductionLog.hasMany(models.ProductionEmployee, {
            foreignKey: "production_id",
            as: "employees",
        });
    };

    return ProductionLog;
};
