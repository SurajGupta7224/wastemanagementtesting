module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define("Category", {
    title: {
      type: DataTypes.STRING,
      allowNull: true
    }
    // add more fields if required
  }, {
    tableName: "category",
    underscored: true
  });

  return Category;
};
