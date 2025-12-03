const db = require("../../models");

exports.getAll = async (req, res) => {
  try {
    const list = await db.Action.findAll({ order: [["id", "ASC"]] });
    return res.json({ status: 1, data: list });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const a = await db.Action.findByPk(id);
    if (!a) return res.status(404).json({ status: 0, message: "Action not found" });
    return res.json({ status: 1, data: a });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const { code, title } = req.body;
    if (!code || !code.toString().trim() || !title || !title.toString().trim()) {
      return res.status(400).json({ status: 0, message: "Both 'code' and 'title' are required." });
    }
    const normalizedCode = String(code).trim();
    const existing = await db.Action.findOne({ where: { code: normalizedCode } });
    if (existing) return res.status(409).json({ status: 0, message: `Action code '${normalizedCode}' already exists.` });
    const a = await db.Action.create({ code: normalizedCode, title: String(title).trim() });
    return res.json({ status: 1, data: a });
  } catch (err) {
    if (err && (err.name === "SequelizeUniqueConstraintError" || (err.errors && err.errors.some(e => e.type === "unique violation")))) {
      const field = (err.errors && err.errors[0] && err.errors[0].path) || "code";
      return res.status(409).json({ status: 0, message: `${field} already exists.` });
    }
    return res.status(500).json({ status: 0, message: "Server error while creating action." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { code, title } = req.body;
    const a = await db.Action.findByPk(id);
    if (!a) return res.status(404).json({ status: 0, message: "Action not found" });
    if (typeof code !== "undefined" && String(code).trim() && String(code).trim() !== a.code) {
      const normalizedCode = String(code).trim();
      const other = await db.Action.findOne({ where: { code: normalizedCode } });
      if (other && String(other.id) !== String(id)) return res.status(409).json({ status: 0, message: `Action code '${normalizedCode}' already exists.` });
      a.code = normalizedCode;
    }
    if (typeof title !== "undefined") a.title = String(title).trim() || a.title;
    await a.save();
    return res.json({ status: 1, data: a });
  } catch (err) {
    if (err && (err.name === "SequelizeUniqueConstraintError" || (err.errors && err.errors.some(e => e.type === "unique violation")))) {
      const field = (err.errors && err.errors[0] && err.errors[0].path) || "code";
      return res.status(409).json({ status: 0, message: `${field} already exists.` });
    }
    return res.status(500).json({ status: 0, message: "Server error while updating action." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await db.Action.destroy({ where: { id } });
    return res.json({ status: 1, deleted });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error" });
  }
};
