// action.model.js
module.exports = (sequelize, DataTypes) => {
  const Action = sequelize.define(
    "Action",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      title: { type: DataTypes.STRING(100), allowNull: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "actions",
      timestamps: false,
    }
  );
  return Action;
};
