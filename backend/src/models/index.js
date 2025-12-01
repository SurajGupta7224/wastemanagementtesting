// src/models/index.js
const path = require("path");
const sequelize = require("../config/db"); // your initialized sequelize instance
const Sequelize = require("sequelize");

/**
 * Helper to load a model file that may export either:
 *  - a model instance (already defined) OR
 *  - a factory function (sequelize, DataTypes) => Model
 */
function loadModel(relPath) {
  const mod = require(relPath);
  if (typeof mod === "function") {
    // factory style, call with sequelize
    try {
      return mod(sequelize, Sequelize.DataTypes || Sequelize);
    } catch (err) {
      // If factory throws, fall back to assuming it's already a model instance
      return mod;
    }
  }
  return mod;
}

// load core models (use same pattern so it's resilient)
const City = loadModel(path.join(__dirname, "city.model"));
const State = loadModel(path.join(__dirname, "state.model"));

// load new models (zone, pincode, zonepincode)
const Zone = loadModel(path.join(__dirname, "zone.model"));
const Pincode = loadModel(path.join(__dirname, "pincode.model"));
const ZonePincode = loadModel(path.join(__dirname, "zonepincode.model"));

const db = {
  sequelize,
  Sequelize,
  City,
  State,
  Zone,
  Pincode,
  ZonePincode,
};

try {
  // State <-> City
  const cityHasState = !!(db.City && db.City.associations && Object.keys(db.City.associations).length);
  const stateHasCities = !!(db.State && db.State.associations && Object.keys(db.State.associations).length);
  if (!cityHasState && !stateHasCities) {
    db.State.hasMany(db.City, { foreignKey: "state_id", as: "cities", onDelete: "CASCADE" });
    db.City.belongsTo(db.State, { foreignKey: "state_id", as: "state" });
  } else {
    // console.log("State<->City associations already present, skipping");
  }

  // Zone -> City
  const zoneHasCity = !!(db.Zone && db.Zone.associations && db.Zone.associations.city);
  const cityHasZone = !!(db.City && db.City.associations && db.City.associations.zones);
  if (!zoneHasCity && !cityHasZone) {
    if (db.Zone && db.City) {
      db.Zone.belongsTo(db.City, { foreignKey: "city_id", as: "city" });
      db.City.hasMany(db.Zone, { foreignKey: "city_id", as: "zones", onDelete: "CASCADE" });
    }
  }

  const zoneHasPincodes = !!(db.Zone && db.Zone.associations && db.Zone.associations.pincodes);
  const pincodeHasZones = !!(db.Pincode && db.Pincode.associations && db.Pincode.associations.zones);
  const zpExists = !!(db.ZonePincode && db.ZonePincode.associations && Object.keys(db.ZonePincode.associations).length);

  if (!zoneHasPincodes && !pincodeHasZones) {
    if (db.Zone && db.Pincode && db.ZonePincode) {
      db.Zone.belongsToMany(db.Pincode, {
        through: db.ZonePincode,
        foreignKey: "zone_id",
        otherKey: "pincode_id",
        as: "pincodes",
      });

      db.Pincode.belongsToMany(db.Zone, {
        through: db.ZonePincode,
        foreignKey: "pincode_id",
        otherKey: "zone_id",
        as: "zones",
      });
      db.ZonePincode.belongsTo(db.Zone, { foreignKey: "zone_id", as: "zone" });
      db.ZonePincode.belongsTo(db.Pincode, { foreignKey: "pincode_id", as: "pincode" });
    }
  }

} catch (err) {
  console.error("Error registering model associations:", err);
}

module.exports = db;
