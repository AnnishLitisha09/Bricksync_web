module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define(
        "Product",
        {
            product_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            product_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            category: {
                type: DataTypes.ENUM("bricks", "sand", "cement"),
                allowNull: false,
            },
            image_url: DataTypes.TEXT,
            description: DataTypes.TEXT,
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: DataTypes.DATE,
        },
        {
            tableName: "products",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    Product.associate = (models) => {
        Product.hasMany(models.ProductStock, {
            foreignKey: "product_id",
            as: "stocks",
        });
        Product.hasMany(models.ProductionLog, {
            foreignKey: "product_id",
            as: "productionLogs",
        });
    };

    return Product;
};
