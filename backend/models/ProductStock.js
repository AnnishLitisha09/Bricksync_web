module.exports = (sequelize, DataTypes) => {
    const ProductStock = sequelize.define(
        "ProductStock",
        {
            stock_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            office_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            quantity: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: DataTypes.DATE,
        },
        {
            tableName: "product_stock",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    ProductStock.associate = (models) => {
        ProductStock.belongsTo(models.Product, {
            foreignKey: "product_id",
            as: "product",
        });
        ProductStock.belongsTo(models.Office, {
            foreignKey: "office_id",
            as: "office",
        });
    };

    return ProductStock;
};
