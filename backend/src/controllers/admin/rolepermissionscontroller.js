const db = require("../../models");
const { Op } = db.Sequelize;

exports.getAllPermissionsGrouped = async (req, res) => {
  try {
    const modules = await db.Module.findAll({
      include: [
        {
          model: db.Permission,
          as: "permissions",
          include: [{ model: db.Action, as: "action" }]
        }
      ],
      order: [["id", "ASC"]]
    });
    return res.json({ status: 1, data: modules });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.getRolePermissions = async (req, res) => {
  try {
    const role_id = parseInt(req.params.role_id, 10);
    if (!role_id || Number.isNaN(role_id)) {
      return res.status(400).json({ status: 0, message: "Invalid role_id" });
    }
    const assigned = await db.RolePermission.findAll({
      where: { role_id },
      attributes: ["permission_id"]
    });
    return res.json({ status: 1, permissions: assigned.map(r => r.permission_id) });
  } catch (err) {
    return res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.updateRolePermissions = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const role_id = parseInt(req.params.role_id, 10);
    const permission_ids = req.body.permission_ids;

    if (!role_id || Number.isNaN(role_id)) {
      await t.rollback();
      return res.status(400).json({ status: 0, message: "Invalid or missing role_id" });
    }
    if (!Array.isArray(permission_ids)) {
      await t.rollback();
      return res.status(400).json({ status: 0, message: "permission_ids must be an array" });
    }

    const normalizedIds = permission_ids
      .map(id => parseInt(id, 10))
      .filter(id => Number.isInteger(id) && id > 0);

    const role = await db.Role.findByPk(role_id, { transaction: t });
    if (!role) {
      await t.rollback();
      return res.status(404).json({ status: 0, message: "Role not found" });
    }

    if (normalizedIds.length > 0) {
      const foundPermissions = await db.Permission.findAll({
        where: { id: { [Op.in]: normalizedIds } },
        attributes: ["id"],
        transaction: t
      });
      const foundIds = foundPermissions.map(p => p.id);
      const missing = normalizedIds.filter(id => !foundIds.includes(id));
      if (missing.length > 0) {
        await t.rollback();
        return res.status(400).json({ status: 0, message: `Some permission IDs do not exist: ${missing.join(",")}` });
      }
    }

    const deleted = await db.RolePermission.destroy({ where: { role_id }, transaction: t });

    const rpAttrs = db.RolePermission && db.RolePermission.rawAttributes ? db.RolePermission.rawAttributes : null;
    let roleAttrName = null;
    let permAttrName = null;

    if (rpAttrs) {
      for (const [attrKey, meta] of Object.entries(rpAttrs)) {
        const lowerKey = String(attrKey).toLowerCase();
        const lowerField = meta.field ? String(meta.field).toLowerCase() : "";
        if (!roleAttrName && (lowerKey.includes("role") || lowerField.includes("role"))) {
          roleAttrName = attrKey;
        }
        if (!permAttrName && (lowerKey.includes("permission") || lowerField.includes("permission") || lowerKey.includes("perm") || lowerField.includes("perm"))) {
          permAttrName = attrKey;
        }
      }
    }

    roleAttrName = roleAttrName || (rpAttrs && rpAttrs.role_id ? "role_id" : (rpAttrs && rpAttrs.roleId ? "roleId" : roleAttrName));
    permAttrName = permAttrName || (rpAttrs && rpAttrs.permission_id ? "permission_id" : (rpAttrs && rpAttrs.permissionId ? "permissionId" : permAttrName));

    if (!roleAttrName || !permAttrName) {
      // if detection failed, roll back and tell the user to share the model / table schema
      await t.rollback();
      return res.status(500).json({
        status: 0,
        message: "Cannot determine RolePermission model's role/permission field names. Check rolepermission.model.js or DESCRIBE role_permissions;",
        rawAttributes: rpAttrs ? Object.keys(rpAttrs) : null
      });
    }

    const inserted = [];
    for (const pid of normalizedIds) {
      const payload = {};
      payload[roleAttrName] = role_id;
      payload[permAttrName] = pid;
      try {
        const rec = await db.RolePermission.create(payload, { transaction: t });
        inserted.push(rec);
      } catch (innerErr) {
        await t.rollback();
        return res.status(500).json({
          status: 0,
          message: `Failed to assign permission ${pid} to role ${role_id}`,
          error: innerErr && innerErr.message ? innerErr.message : String(innerErr),
          attemptedPayload: payload
        });
      }
    }

    await t.commit();
    return res.json({ status: 1, message: "Permissions updated successfully", assigned: normalizedIds });
  } catch (err) {
    try { await t.rollback(); } catch (e) {}
    return res.status(500).json({ status: 0, message: "Server error while updating permissions", error: err.message || String(err) });
  }
};
