"use strict";

module.exports = (sequelize, DataTypes) => {
  const ContactInfo = sequelize.define(
    "ContactInfo",
    {
      name: DataTypes.STRING,
      phone: DataTypes.STRING,
      email: DataTypes.STRING,
      isviewed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {}
  );

  return ContactInfo;
};
