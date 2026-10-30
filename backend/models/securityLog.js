module.exports = (sequelize, DataTypes) => {
  const SecurityLog = sequelize.define(
    "SecurityLog",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ip_address: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      endpoint: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      method: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      user_role: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      threat_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      status_code: {
        type: DataTypes.INTEGER,
        defaultValue: 403,
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "security_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return SecurityLog;
};
