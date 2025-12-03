module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "City",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      state_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(200), allowNull: false },
      city_code: { type: DataTypes.STRING(20), allowNull: true },
      status: { type: DataTypes.INTEGER, defaultValue: 1 },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: true }
    },
    {
      tableName: "cities",
      timestamps: false
    }
  );
};
