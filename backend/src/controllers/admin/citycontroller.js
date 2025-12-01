// src/controllers/admin/citycontroller.js
const { City, State, Sequelize } = require("../../models");
const { Op } = Sequelize;
// ===========================
// Get All Cities
// ===========================
exports.getAllCities = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const search = (req.query.search || "").trim();
    const sort = req.query.sort || "name";
    const dir = (req.query.dir || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC";

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { city_code: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { rows: cities, count: total } = await City.findAndCountAll({
      where,
      include: [
        {
          model: State,
          as: "state",
          attributes: ["id", "name", "code"]
        }
      ],
      order: [[sort, dir]],
      limit,
      offset,
      attributes: ["id", "state_id", "name", "city_code", "status", "created_at", "updated_at"]
    });

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      status: 1,
      message: "Cities fetched successfully",
      data: cities,
      meta: {
        total,
        page,
        limit,
        totalPages,
        from: total === 0 ? 0 : offset + 1,
        to: Math.min(offset + cities.length, total)
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 0, message: error.message });
  }
};

// ===========================
// Get Pincodes by City
// ===========================
exports.getPincodesByCity = async (req, res) => {
  try {
    const { city_id } = req.params;

    const pincodes = await db.Pincode.findAll({
      where: { city_id },
      attributes: ["id", "pincode"]
    });

    return res.status(200).json({
      status: 1,
      message: "Pincodes fetched successfully",
      data: pincodes
    });
  } catch (err) {
    return res.status(500).json({ status: 0, message: err.message });
  }
};

// ===========================
// Get Cities by State
// ===========================

exports.getCitiesByState = async (req, res) => {
  try {
    const { state_id } = req.params;
    const cities = await City.findAll({
      where: { state_id },
      order: [["name", "ASC"]],
      attributes: ["id", "state_id", "name", "city_code", "status", "created_at", "updated_at"]
    });

    return res.status(200).json({
      status: 1,
      message: "Cities fetched successfully",
      data: cities
    });
  } catch (error) {
    return res.status(500).json({ status: 0, message: error.message });
  }
};

// ===========================
// Get City by ID
// ===========================

exports.getCityById = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await City.findByPk(id, {
      include: [
        {
          model: State,
          as: "state",
          attributes: ["id", "name", "code"]
        }
      ]
    });

    if (!city) {
      return res.status(404).json({ status: 0, message: "City not found" });
    }

    return res.status(200).json({
      status: 1,
      message: "City fetched successfully",
      data: city
    });
  } catch (error) {
    return res.status(500).json({ status: 0, message: error.message });
  }
};

// ===========================
// Create City
// ===========================  

exports.createCity = async (req, res) => {
  try {
    const { state_id, name, city_code, status } = req.body;

    if (!state_id || !name) {
      return res.status(400).json({ status: 0, message: "state_id and name are required" });
    }

    const normalized = (name || "").trim();
    const existing = await City.findOne({
      where: {
        state_id,
        [Op.and]: Sequelize.where(Sequelize.fn("lower", Sequelize.col("name")), normalized.toLowerCase())
      }
    });

    if (existing) {
      return res.status(409).json({ status: 0, message: "City with the same name already exists in this state" });
    }

    const newCity = await City.create({
      state_id,
      name: normalized,
      city_code,
      status: status ?? 1,
      created_at: new Date()
    });

    return res.status(201).json({
      status: 1,
      message: "City created successfully",
      data: newCity
    });
  } catch (error) {
    return res.status(500).json({ status: 0, message: error.message });
  }
};

// ===========================
// Update City
// ===========================

exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { state_id, name, city_code, status } = req.body;

    const city = await City.findByPk(id);

    if (!city) {
      return res.status(404).json({ status: 0, message: "City not found" });
    }

    // if name/state changed, check duplicate
    const newName = typeof name !== "undefined" && name !== null ? String(name).trim() : city.name;
    const newStateId = typeof state_id !== "undefined" && state_id !== null ? state_id : city.state_id;

    if ((newName && newName.toLowerCase() !== (city.name || "").toLowerCase()) || (newStateId !== city.state_id)) {
      const dup = await City.findOne({
        where: {
          id: { [Op.ne]: id },
          state_id: newStateId,
          [Op.and]: Sequelize.where(Sequelize.fn("lower", Sequelize.col("name")), newName.toLowerCase())
        }
      });
      if (dup) {
        return res.status(409).json({ status: 0, message: "Another city with same name exists in this state" });
      }
    }

    city.state_id = state_id ?? city.state_id;
    city.name = newName ?? city.name;
    city.city_code = city_code ?? city.city_code;
    city.status = status ?? city.status;
    city.updated_at = new Date();

    await city.save();

    return res.status(200).json({
      status: 1,
      message: "City updated successfully",
      data: city
    });
  } catch (error) {
    return res.status(500).json({ status: 0, message: error.message });
  }
};

// ===========================
// Delete City
// ===========================

exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await City.findByPk(id);

    if (!city) {
      return res.status(404).json({ status: 0, message: "City not found" });
    }

    await city.destroy();

    return res.status(200).json({
      status: 1,
      message: "City deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ status: 0, message: error.message });
  }
};
