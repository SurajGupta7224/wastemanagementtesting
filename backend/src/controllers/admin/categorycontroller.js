const db = require("../../models");

exports.getAll = async (req, res) => {
  try {
    const items = await db.Category.findAll({ order: [["id", "ASC"]] });
    res.json({ status: 1, data: items });
  } catch (err) {
    console.error("categorycontroller.getAll", err);
    res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const obj = req.body || {};
    const created = await db.Category.create(obj);
    res.json({ status: 1, data: created });
  } catch (err) {
    console.error("categorycontroller.create", err);
    res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const obj = req.body || {};
    const m = await db.Category.findByPk(id);
    if (!m) return res.status(404).json({ status: 0, message: "Not found" });
    await m.update(obj);
    res.json({ status: 1, data: m });
  } catch (err) {
    console.error("categorycontroller.update", err);
    res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const d = await db.Category.destroy({ where: { id } });
    res.json({ status: 1, deleted: d });
  } catch (err) {
    console.error("categorycontroller.delete", err);
    res.status(500).json({ status: 0, message: "Server error" });
  }
};
