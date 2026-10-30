module.exports = (sequelize, DataTypes) => {
    const ProductionRecipeItem = sequelize.define(
        "ProductionRecipeItem",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            recipe_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            material_product_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            material_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            quantity: {
                type: DataTypes.DECIMAL(10, 4),
                allowNull: false,
            },
            unit: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            is_cement: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            tableName: "production_recipe_items",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    ProductionRecipeItem.associate = (models) => {
        ProductionRecipeItem.belongsTo(models.ProductionRecipe, {
            foreignKey: "recipe_id",
            as: "recipe",
        });
        ProductionRecipeItem.belongsTo(models.Product, {
            foreignKey: "material_product_id",
            as: "materialProduct",
        });
    };

    return ProductionRecipeItem;
};
