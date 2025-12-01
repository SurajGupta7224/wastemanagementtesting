// src/models/zonepincode.model.js
module.exports = (sequelize, DataTypes) => {
  const ZonePincode = sequelize.define(
    "ZonePincode",
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
        
      },
      zone_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
        
      },
      pincode_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
        
      }
    },
    {
      tableName: "zone_pincodes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );

  ZonePincode.associate = (models) => {
    if (models.Zone) {
      ZonePincode.belongsTo(models.Zone, { foreignKey: "zone_id", as: "zone" });
    }
    if (models.Pincode) {
      ZonePincode.belongsTo(models.Pincode, { foreignKey: "pincode_id", as: "pincode" });
    }
  };

  return ZonePincode;
};

