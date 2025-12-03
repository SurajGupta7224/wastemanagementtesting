const express = require("express");
const router = express.Router();

const authController = require("../controllers/admin/authcontroller");
const ModuleController = require("../controllers/admin/modulecontroller");
const ActionController = require("../controllers/admin/actionscontroller");
const PermissionController = require("../controllers/admin/permissionscontroller");
const RolesController = require("../controllers/admin/rolescontroller");
const RolepermissionsController = require("../controllers/admin/rolepermissionscontroller");
const UsersController = require("../controllers/admin/userscontroller");
const CityController = require("../controllers/admin/citycontroller");
const StateController = require("../controllers/admin/statecontroller");
const ZoneController = require("../controllers/admin/zonecontroller");
const OrderController = require("../controllers/admin/ordercontroller");
const CategoryController = require("../controllers/admin/categorycontroller");



// ------------------ AUTH ------------------
router.post("/login", authController.login);
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);


// ----------- MODULES -----------
router.get("/modules", ModuleController.getAll);
router.post("/modules", ModuleController.create);
router.put("/modules/:id", ModuleController.update);
router.delete("/modules/:id", ModuleController.delete);



// ------------------ EXPORT ------------------


// ------------------ ACTIONS ------------------
router.get("/actions", ActionController.getAll);
router.post("/actions", ActionController.create);
router.put("/actions/:id", ActionController.update);
router.delete("/actions/:id", ActionController.delete);



// --- auto-routes for module: permissions ---

router.get("/permissions", PermissionController.getAll);
router.post("/permissions", PermissionController.create);
router.put("/permissions/:id", PermissionController.update);
router.delete("/permissions/:id", PermissionController.delete);


// --- auto-routes for module: roles ---
router.get("/roles", RolesController.getAll);
router.post("/roles", RolesController.create);
router.put("/roles/:id", RolesController.update);
router.delete("/roles/:id", RolesController.delete);



// --- auto-routes for module: rolepermissions ---

// ------------------ ROLE → PERMISSIONS ------------------
router.get("/permission-groups", RolepermissionsController.getAllPermissionsGrouped);
router.get("/roles/:role_id/permissions", RolepermissionsController.getRolePermissions);
router.post("/roles/:role_id/permissions", RolepermissionsController.updateRolePermissions);


// --- auto-routes for module: users ---
router.get("/users", UsersController.getAll);
router.post("/users", UsersController.create);
router.put("/users/:id", UsersController.update);
router.delete("/users/:id", UsersController.delete);



// --- auto-routes for module: city ---
router.get("/city", CityController.getAllCities);
router.get("/city/state/:state_id", CityController.getCitiesByState);
router.get("/city/:id", CityController.getCityById);
router.get("/city/:city_id/pincodes", CityController.getPincodesByCity);
router.post("/city", CityController.createCity);
router.put("/city/:id", CityController.updateCity);
router.patch("/city/:id/status", CityController.updateCityStatus);


// ------------------ CITIES ------------------
router.get("/cities", CityController.getAllCities);
router.get("/cities/state/:state_id", CityController.getCitiesByState);
router.get("/cities/:id", CityController.getCityById);
router.get("/cities/:city_id/pincodes", CityController.getPincodesByCity);
router.post("/cities", CityController.createCity);
router.put("/cities/:id", CityController.updateCity);
router.patch("/cities/:id/status", CityController.updateCityStatus);


// ------------------ STATES ------------------
router.get("/states", StateController.getStates);
router.get("/allstates", StateController.allStates);
router.get("/states/:id", StateController.getStateById);
router.post("/states", StateController.createState);
router.put("/states/:id", StateController.updateState);
router.delete("/states/:id", StateController.deleteState);


// ------------------ ZONES ------------------
router.get("/zones", ZoneController.getAllZones);
router.get("/zones/:id", ZoneController.getZoneById);
router.post("/zones", ZoneController.createZone);
router.put("/zones/:id", ZoneController.updateZone);
router.post("/zones/:id/status", ZoneController.updateZoneStatus);




// --- auto-routes for module: order ---
router.get("/order", OrderController.getAll);
router.post("/order", OrderController.create);
router.put("/order/:id", OrderController.update);
router.delete("/order/:id", OrderController.delete);



// --- auto-routes for module: category ---
router.get("/category", CategoryController.getAll);
router.post("/category", CategoryController.create);
router.put("/category/:id", CategoryController.update);
router.delete("/category/:id", CategoryController.delete);

module.exports = router;
