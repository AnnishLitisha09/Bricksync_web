module.exports = (sequelize, DataTypes) => {
    const MaterialEntryField = sequelize.define(
        "MaterialEntryField",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            entry_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            field_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            field_value: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: "material_entry_fields",
            timestamps: true,
        }
    );

    MaterialEntryField.associate = (models) => {
        MaterialEntryField.belongsTo(models.MaterialEntry, {
            foreignKey: "entry_id",
            as: "entry",
        });
    };

    return MaterialEntryField;
};
