module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    title: {
      type: DataTypes.STRING,
      allowNull: true
    }
    // add more fields if required
  }, {
    tableName: "order",
    underscored: true
  });

  return Order;
};
