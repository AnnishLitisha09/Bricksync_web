module.exports = (sequelize, DataTypes) => {
    const CallLog = sequelize.define(
        "CallLog",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            cus_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            next_call_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: DataTypes.DATE,
        },
        {
            tableName: "call_logs",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    CallLog.associate = (models) => {
        CallLog.belongsTo(models.Customer, {
            foreignKey: "cus_id",
            as: "customer",
        });
    };

    return CallLog;
};
