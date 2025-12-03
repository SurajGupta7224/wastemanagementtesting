const db = require("../../models");

exports.getAll = async (req, res) => {
  try {
    const list = await db.Permission.findAll({
      include: [
        { model: db.Module, as: "module", attributes: ["id", "code", "title"] },
        { model: db.Action, as: "action", attributes: ["id", "code", "title"] },
      ],
      order: [["id", "ASC"]],
    });

    return res.json({ status: 1, data: list });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const { module_id, action_id, label } = req.body;

    if (!module_id || !action_id) {
      return res.status(400).json({ status: 0, message: "module_id and action_id are required" });
    }

    const module = await db.Module.findByPk(module_id);
    const action = await db.Action.findByPk(action_id);

    if (!module) return res.status(404).json({ status: 0, message: "Module not found" });
    if (!action) return res.status(404).json({ status: 0, message: "Action not found" });

    const permission_key = `${module.code}.${action.code}`;

    const exists = await db.Permission.findOne({ where: { permission_key } });
    if (exists) {
      return res.status(409).json({ status: 0, message: `Permission '${permission_key}' already exists` });
    }

    const p = await db.Permission.create({
      module_id,
      action_id,
      permission_key,
      label: label || permission_key,
    });

    return res.json({ status: 1, data: p });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error while creating permission" });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { module_id, action_id, label } = req.body;

    const p = await db.Permission.findByPk(id);
    if (!p) return res.status(404).json({ status: 0, message: "Permission not found" });

    let permission_key = p.permission_key;

    if (module_id || action_id) {
      const module = await db.Module.findByPk(module_id || p.module_id);
      const action = await db.Action.findByPk(action_id || p.action_id);

      permission_key = `${module.code}.${action.code}`;

      const exists = await db.Permission.findOne({
        where: { permission_key, id: { [db.Sequelize.Op.ne]: id } },
      });

      if (exists) {
        return res.status(409).json({ status: 0, message: `Permission '${permission_key}' already exists` });
      }
    }

    await p.update({
      module_id: module_id ?? p.module_id,
      action_id: action_id ?? p.action_id,
      permission_key,
      label: label || permission_key,
    });

    return res.json({ status: 1, data: p });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error while updating permission" });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await db.Permission.destroy({ where: { id } });
    return res.json({ status: 1, deleted });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error while deleting" });
  }
};
