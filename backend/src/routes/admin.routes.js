const express = require("express");
const router = express.Router();
const authController = require("../controllers/admin/authController");
const CityController = require("../controllers/admin/citycontroller");
const StateController = require("../controllers/admin/statecontroller");
const ZoneController = require("../controllers/admin/zonecontroller");


// authentication
router.post("/login", authController.login);
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);

// cities
router.get("/cities", CityController.getAllCities);
router.get("/cities/state/:state_id", CityController.getCitiesByState);
router.get("/cities/:id", CityController.getCityById);
router.get("/cities/:city_id/pincodes", CityController.getPincodesByCity);

// states
router.get("/states", StateController.getAllStates);
router.get("/states/:id", StateController.getStateById);
router.post("/states", StateController.createState);
router.put("/states/:id", StateController.updateState);
router.delete("/states/:id", StateController.deleteState);


// zones
router.get("/zones", ZoneController.getAllZones);
router.get("/zones/:id", ZoneController.getZoneById);
router.post("/zones", ZoneController.createZone);
router.put("/zones/:id", ZoneController.updateZone);
router.delete("/zones/:id", ZoneController.deleteZone);

// other routes...
module.exports = router;
