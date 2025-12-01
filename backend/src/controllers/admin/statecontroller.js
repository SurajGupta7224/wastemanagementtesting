const { State } = require("../../models");
const { Op } = require("sequelize");
// ===========================
// Get All States
// ===========================
exports.getAllStates = async (req, res) => {
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
        { code: { [Op.like]: `%${search}%` } }
      ];
    }
    const offset = (page - 1) * limit;
    const { rows: states, count: total } = await State.findAndCountAll({
      where,
      order: [[sort, dir]],
      limit,
      offset,
      attributes: ["id", "name", "code", "created_at", "updated_at"]
    });
    const totalPages = Math.ceil(total / limit);
    return res.status(200).json({
      status: 1,
      message: "States fetched successfully",
      data: states,
      meta: {
        total,
        page,
        limit,
        totalPages,
        from: total === 0 ? 0 : offset + 1,
        to: Math.min(offset + states.length, total)
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 0, message: error.message });
  }
};
// ===========================
// Get Single State by ID
// ===========================
exports.getStateById = async (req, res) => {
  try {
    const { id } = req.params;
    const state = await State.findByPk(id, {
      attributes: ["id", "name", "code", "created_at", "updated_at"]
    });

    if (!state) {
      return res.status(404).json({ status: 0, message: "State not found" });
    }

    return res.status(200).json({
      status: 1,
      message: "State fetched successfully",
      data: state
    });
  } catch (error) {
    return res.status(500).json({ status: 0, message: error.message });
  }
};

// ===========================
// Create New State
// ===========================
exports.createState = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 0, message: "State name is required" });
    }

    // optional: normalize
    const payload = {
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : null
    };

    const newState = await State.create(payload);

    return res.status(201).json({
      status: 1,
      message: "State created successfully",
      data: newState
    });
  } catch (error) {
    // handle unique constraint error nicely if you want
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ status: 0, message: "State with same name/code already exists" });
    }
    return res.status(500).json({ status: 0, message: error.message });
  }
};

// ===========================
// Update State
// ===========================
exports.updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const state = await State.findByPk(id);
    if (!state) {
      return res.status(404).json({ status: 0, message: "State not found" });
    }

    state.name = (name && name.trim()) ? name.trim() : state.name;
    state.code = (typeof code !== "undefined" && code !== null) ? (code.trim().toUpperCase()) : state.code;
    state.updated_at = new Date();

    await state.save();

    return res.status(200).json({
      status: 1,
      message: "State updated successfully",
      data: state
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ status: 0, message: "State with same name/code already exists" });
    }
    return res.status(500).json({ status: 0, message: error.message });
  }
};

// ===========================
// Delete State
// ===========================
exports.deleteState = async (req, res) => {
  try {
    const { id } = req.params;

    const state = await State.findByPk(id);
    if (!state) {
      return res.status(404).json({ status: 0, message: "State not found" });
    }

    await state.destroy();

    return res.status(200).json({
      status: 1,
      message: "State deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ status: 0, message: error.message });
  }
};
