module.exports = (sequelize, DataTypes) => {
    const Office = sequelize.define(
        "Office",
        {
            office_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            office_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            location: DataTypes.STRING(150),
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: DataTypes.DATE,
        },
        {
            tableName: "offices",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    Office.associate = (models) => {
        Office.hasMany(models.ProductStock, {
            foreignKey: "office_id",
            as: "stocks",
        });
        Office.hasMany(models.ProductionLog, {
            foreignKey: "office_id",
            as: "productionLogs",
        });
    };

    return Office;
};
