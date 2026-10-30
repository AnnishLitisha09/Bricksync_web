module.exports = (sequelize, DataTypes) => {
    const ProductionRecipe = sequelize.define(
        "ProductionRecipe",
        {
            id: {
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
            batch_bricks: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 1000.00,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            tableName: "production_recipes",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    ProductionRecipe.associate = (models) => {
        ProductionRecipe.belongsTo(models.Office, {
            foreignKey: "office_id",
            as: "office",
        });
        ProductionRecipe.belongsTo(models.Product, {
            foreignKey: "product_id",
            as: "product",
        });
        ProductionRecipe.hasMany(models.ProductionRecipeItem, {
            foreignKey: "recipe_id",
            as: "items",
            onDelete: "CASCADE",
        });
    };

    return ProductionRecipe;
};
