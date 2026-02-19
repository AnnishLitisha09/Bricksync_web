module.exports = (sequelize, DataTypes) => {
    const Employee = sequelize.define(
        "Employee",
        {
            employee_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            employee_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: DataTypes.DATE,
        },
        {
            tableName: "employees",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    Employee.associate = (models) => {
        Employee.hasMany(models.ProductionEmployee, {
            foreignKey: "employee_id",
            as: "productions",
        });
    };

    return Employee;
};
