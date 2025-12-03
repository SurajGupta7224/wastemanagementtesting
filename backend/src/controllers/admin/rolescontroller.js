const db = require("../../models");

exports.getAll = async (req, res) => {
  try {
    const list = await db.Role.findAll({ order: [["id", "ASC"]] });
    return res.json({ status: 1, data: list });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const r = await db.Role.findByPk(id);
    if (!r) return res.status(404).json({ status: 0, message: "Role not found" });
    return res.json({ status: 1, data: r });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name || !name.toString().trim()) {
      return res.status(400).json({ status: 0, message: "Role name is required." });
    }
    const normalizedName = String(name).trim();
    const existing = await db.Role.findOne({ where: { name: normalizedName } });
    if (existing) {
      return res.status(409).json({ status: 0, message: `Role '${normalizedName}' already exists.` });
    }
    const r = await db.Role.create({
      name: normalizedName,
      description: description?.trim() || null,
      status: typeof status === "undefined" ? 1 : status
    });
    return res.json({ status: 1, data: r });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error while creating role." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, status } = req.body;
    const r = await db.Role.findByPk(id);
    if (!r) return res.status(404).json({ status: 0, message: "Role not found" });
    if (typeof name !== "undefined" && String(name).trim() && String(name).trim() !== r.name) {
      const normalizedName = String(name).trim();
      const other = await db.Role.findOne({ where: { name: normalizedName } });
      if (other && String(other.id) !== String(id)) {
        return res.status(409).json({ status: 0, message: `Role '${normalizedName}' already exists.` });
      }
      r.name = normalizedName;
    }
    if (typeof description !== "undefined") {
      r.description = description?.trim() || null;
    }
    if (typeof status !== "undefined") {
      r.status = status;
    }
    await r.save();
    return res.json({ status: 1, data: r });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error while updating role." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await db.Role.destroy({ where: { id } });
    return res.json({ status: 1, deleted });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error" });
  }
};
