// src/models/pincode.model.js
module.exports = (sequelize, DataTypes) => {
  const Pincode = sequelize.define(
    "Pincode",
    {
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        pincode: { 
            type: DataTypes.STRING(10), 
            allowNull: false, 
            unique: true 
        },
        city_id: { 
            type: DataTypes.INTEGER, 
            allowNull: true 
        }
    },
    {
      tableName: "pincodes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  Pincode.associate = (models) => {
    if (models.Zone && models.ZonePincode) {
      Pincode.belongsToMany(models.Zone, {
        through: models.ZonePincode,
        foreignKey: "pincode_id",
        otherKey: "zone_id",
        as: "zones"
      });
    }

    if (models.City) {
      Pincode.belongsTo(models.City, { foreignKey: "city_id", as: "city" });
    }
  };

  return Pincode;
};
