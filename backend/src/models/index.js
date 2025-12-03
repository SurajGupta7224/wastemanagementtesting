const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const sequelize = require("../config/db");

const basename = path.basename(__filename);
const modelsDir = __dirname;

const db = {
  sequelize,
  Sequelize
};

function loadModelFromFile(filePath) {
  const mod = require(filePath);
  if (typeof mod === "function") {
    return mod(sequelize, Sequelize.DataTypes || Sequelize);
  }
  return mod;
}

fs.readdirSync(modelsDir)
  .filter((file) => {
    return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";
  })
  .forEach((file) => {
    const full = path.join(modelsDir, file);
    try {
      const model = loadModelFromFile(full);
      const key = model && model.name ? model.name : path.basename(file, ".js");
      db[key] = model;
    } catch (err) {
      console.error(`Error loading model file ${file}:`, err);
    }
  });

if (!db.Role && db.role) db.Role = db.role;
if (!db.Module && db.module) db.Module = db.module;
if (!db.Action && db.action) db.Action = db.action;
if (!db.Permission && db.permission) db.Permission = db.permission;
if (!db.RolePermission && db.rolepermission) db.RolePermission = db.rolepermission;
if (!db.User && db.users) db.User = db.users;
if (!db.User && db.user) db.User = db.user;

try {
  if (db.Module && db.Permission) {
    db.Module.hasMany(db.Permission, { foreignKey: "module_id", as: "permissions", onDelete: "CASCADE" });
    db.Permission.belongsTo(db.Module, { foreignKey: "module_id", as: "module" });
  }

  if (db.Action && db.Permission) {
    db.Action.hasMany(db.Permission, { foreignKey: "action_id", as: "permissions", onDelete: "CASCADE" });
    db.Permission.belongsTo(db.Action, { foreignKey: "action_id", as: "action" });
  }

  if (db.Role && db.Permission && db.RolePermission) {
    db.Role.belongsToMany(db.Permission, {
      through: db.RolePermission,
      foreignKey: "role_id",
      otherKey: "permission_id",
      as: "permissions"
    });

    db.Permission.belongsToMany(db.Role, {
      through: db.RolePermission,
      foreignKey: "permission_id",
      otherKey: "role_id",
      as: "roles"
    });

    db.RolePermission.belongsTo(db.Role, { foreignKey: "role_id", as: "role" });
    db.RolePermission.belongsTo(db.Permission, { foreignKey: "permission_id", as: "permission" });
  }

  if (db.Role && db.User) {
    db.Role.hasMany(db.User, { foreignKey: "role_id", as: "users", onDelete: "SET NULL" });
    db.User.belongsTo(db.Role, { foreignKey: "role_id", as: "role" });
  }

  if (db.State && db.City) {
    db.State.hasMany(db.City, { foreignKey: "state_id", as: "cities", onDelete: "CASCADE" });
    db.City.belongsTo(db.State, { foreignKey: "state_id", as: "state" });
  }

  if (db.City && db.Zone) {
    db.City.hasMany(db.Zone, { foreignKey: "city_id", as: "zones", onDelete: "CASCADE" });
    db.Zone.belongsTo(db.City, { foreignKey: "city_id", as: "city" });
  }

  if (db.Zone && db.Pincode && db.ZonePincode) {
    db.Zone.belongsToMany(db.Pincode, {
      through: db.ZonePincode,
      foreignKey: "zone_id",
      otherKey: "pincode_id",
      as: "pincodes"
    });

    db.Pincode.belongsToMany(db.Zone, {
      through: db.ZonePincode,
      foreignKey: "pincode_id",
      otherKey: "zone_id",
      as: "zones"
    });
  }

} catch (err) {
  console.error("Error registering associations:", err);
}

module.exports = db;
