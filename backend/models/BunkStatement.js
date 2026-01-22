module.exports = (sequelize, DataTypes) => {
  const BunkStatement = sequelize.define(
    "BunkStatement",
    {
      statementId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      bunkId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: true, // <-- make this nullable
      },
      fuelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      isFueled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      tableName: "bunk_statements",
      timestamps: true,
    }
  );

  return BunkStatement;
};
