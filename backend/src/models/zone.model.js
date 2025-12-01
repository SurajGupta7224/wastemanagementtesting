// src/models/zone.model.js
module.exports = (sequelize, DataTypes) => {
  const Zone = sequelize.define(
    "Zone",
    {
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        city_id: { 
            type: DataTypes.INTEGER, 
            allowNull: false 
        },
        name: { 
            type: DataTypes.STRING(255), 
            allowNull: false 
        },
        code: { 
            type: DataTypes.STRING(50), 
            allowNull: true 
        },
        status: { 
            type: DataTypes.TINYINT, 
            allowNull: false, defaultValue: 1 
        }
    },
    {
      tableName: "zones",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  Zone.associate = (models) => {
    if (models.City) {
      Zone.belongsTo(models.City, { foreignKey: "city_id", as: "city" });
    }
    if (models.Pincode && models.ZonePincode) {
      Zone.belongsToMany(models.Pincode, {
        through: models.ZonePincode,
        foreignKey: "zone_id",
        otherKey: "pincode_id",
        as: "pincodes"
      });
    }
  };

  return Zone;
};
