// backend/src/controllers/admin/modulecontroller.js
const path = require("path");
const fs = require("fs").promises;
const db = require("../../models");
const { safeWriteFile, pascalCase } = require("../../utils/fileHelper");

// adjust roots if your layout is different:
const controllersAdminDir = path.resolve(__dirname); // backend/src/controllers/admin
const backendModelsDir = path.resolve(__dirname, "../..", "models"); // backend/src/models
const backendRoutesDir = path.resolve(__dirname, "../..", "routes"); // backend/src/routes
const frontendRoot = path.resolve(__dirname, "..","..", "..", "..", "adminFrontend", "src"); // adjust if needed

// --- TEMPLATES using your naming conventions ---
// Controller template (e.g., locationcontroller.js)
function backendControllerTemplate(moduleCode) {
  const pascal = pascalCase(moduleCode);
  return `const db = require("../../models");

exports.getAll = async (req, res) => {
  try {
    const items = await db.${pascal}.findAll({ order: [["id", "ASC"]] });
    res.json({ status: 1, data: items });
  } catch (err) {
    console.error("${moduleCode}controller.getAll", err);
    res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const obj = req.body || {};
    const created = await db.${pascal}.create(obj);
    res.json({ status: 1, data: created });
  } catch (err) {
    console.error("${moduleCode}controller.create", err);
    res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const obj = req.body || {};
    const m = await db.${pascal}.findByPk(id);
    if (!m) return res.status(404).json({ status: 0, message: "Not found" });
    await m.update(obj);
    res.json({ status: 1, data: m });
  } catch (err) {
    console.error("${moduleCode}controller.update", err);
    res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const d = await db.${pascal}.destroy({ where: { id } });
    res.json({ status: 1, deleted: d });
  } catch (err) {
    console.error("${moduleCode}controller.delete", err);
    res.status(500).json({ status: 0, message: "Server error" });
  }
};
`;
}

// Model template (e.g., location.model.js)
function backendModelTemplate(moduleCode) {
  const pascal = pascalCase(moduleCode);
  return `module.exports = (sequelize, DataTypes) => {
  const ${pascal} = sequelize.define("${pascal}", {
    title: {
      type: DataTypes.STRING,
      allowNull: true
    }
    // add more fields if required
  }, {
    tableName: "${moduleCode}",
    underscored: true
  });

  return ${pascal};
};
`;
}

// Frontend page template (adminFrontend/src/pages/LocationPage.jsx)
// 👉 Yaha sirf simple welcome text rakha hai
function frontendPageTemplate(moduleCode) {
  const pascal = pascalCase(moduleCode);
  return `import React from "react";

export default function ${pascal}Page() {
  return (
    <div className="p-6 ml-72">
      <h1 className="text-2xl font-bold">Welcome to ${pascal} module</h1>
    </div>
  );
}
`;
}

// ==================== CRUD Handlers for Module model ====================
exports.getAll = async (req, res) => {
  try {
    const modules = await db.Module.findAll({ order: [["id", "DESC"]] });
    res.json({ status: 1, data: modules });
  } catch (err) {
    console.error("module.getAll", err);
    res.status(500).json({ status: 0, message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const { code, title } = req.body;

    if (!code || !code.toString().trim() || !title || !title.toString().trim()) {
      return res.status(400).json({ status: 0, message: "Both 'code' and 'title' are required." });
    }

    const normalizedCode = String(code).trim();

    const existing = await db.Module.findOne({ where: { code: normalizedCode } });
    if (existing) {
      return res.status(409).json({ status: 0, message: `Module code '${normalizedCode}' already exists.` });
    }

    const m = await db.Module.create({ code: normalizedCode, title: String(title).trim() });

    // === file creation (best-effort) & admin.routes.js update (no separate route file) ===
    try {
      const controllerPath = path.join(controllersAdminDir, `${normalizedCode}controller.js`);
      const modelPath = path.join(backendModelsDir, `${normalizedCode}.model.js`);
      const frontendPagePath = path.join(frontendRoot, "pages", `${pascalCase(normalizedCode)}Page.jsx`);
      const adminRoutesFile = path.join(backendRoutesDir, "admin.routes.js");

      // 1) create controller + model + frontend page (best-effort)
      await safeWriteFile(controllerPath, backendControllerTemplate(normalizedCode));
      await safeWriteFile(modelPath, backendModelTemplate(normalizedCode));
      try {
        await safeWriteFile(frontendPagePath, frontendPageTemplate(normalizedCode));
      } catch (fe) {
        console.warn("module.create: frontend page write skipped or failed", fe && fe.message);
      }

      // 2) Update admin.routes.js:
      //    a) Insert controller import near top: const <Pascal>Controller = require("../controllers/admin/<code>controller");
      //    b) Insert route block that uses <Pascal>Controller.getAll/create/update/delete
      const pascalName = pascalCase(normalizedCode); // e.g., City
      const controllerImportLine = `const ${pascalName}Controller = require("../controllers/admin/${normalizedCode}controller");`;
      const routeBlockComment = `// --- auto-routes for module: ${normalizedCode} ---`;
      const routeBlock = `
${routeBlockComment}
router.get("/${normalizedCode}", ${pascalName}Controller.getAll);
router.post("/${normalizedCode}", ${pascalName}Controller.create);
router.put("/${normalizedCode}/:id", ${pascalName}Controller.update);
router.delete("/${normalizedCode}/:id", ${pascalName}Controller.delete);
`;

      // read admin.routes.js if available
      let adminContent = null;
      try {
        adminContent = await fs.readFile(adminRoutesFile, "utf8");
      } catch (readErr) {
        console.warn("module.create: could not read admin.routes.js — skipping auto-route/import append.", readErr && readErr.message);
        adminContent = null;
      }

      if (adminContent !== null) {
        let modified = adminContent;

        // --- ensure controller import exists ---
        const importAlready = new RegExp(
          `const\\s+${pascalName}Controller\\s*=\\s*require\\(\\s*["']\\.\\.\\/controllers\\/admin\\/${normalizedCode}controller["']\\s*\\)`
        ).test(modified);
        if (!importAlready) {
          const importRegex = /const\s+\w+\s*=\s*require\(\s*["']\.\.\/controllers\/admin\/[^\)]+?\);?/g;
          let lastMatch;
          let match;
          while ((match = importRegex.exec(modified)) !== null) {
            lastMatch = match;
          }

          if (lastMatch && lastMatch.index !== undefined) {
            const insertPos = lastMatch.index + lastMatch[0].length;
            modified =
              modified.slice(0, insertPos) +
              `\n${controllerImportLine}` +
              modified.slice(insertPos);
          } else {
            const firstNewline = modified.indexOf("\n");
            if (firstNewline !== -1) {
              modified =
                modified.slice(0, firstNewline + 1) +
                `${controllerImportLine}\n` +
                modified.slice(firstNewline + 1);
            } else {
              modified = `${controllerImportLine}\n` + modified;
            }
          }
        }

        // --- ensure route block exists ---
        const hasRouteBlock =
          modified.includes(routeBlockComment) ||
          modified.includes(`router.get("/${normalizedCode}"`) ||
          modified.includes(`router.post("/${normalizedCode}"`);
        if (!hasRouteBlock) {
          const exportIndex = modified.lastIndexOf("module.exports");
          if (exportIndex !== -1) {
            const before = modified.slice(0, exportIndex);
            const after = modified.slice(exportIndex);
            modified = `${before}\n${routeBlock}\n${after}`;
          } else {
            modified = `${modified}\n${routeBlock}\n`;
          }
        }

        if (modified !== adminContent) {
          try {
            await fs.writeFile(adminRoutesFile, modified, "utf8");
            console.log(
              `module.create: updated admin.routes.js — added import & routes for ${normalizedCode}`
            );
          } catch (writeErr) {
            console.warn(
              "module.create: failed to write admin.routes.js — skipping route/import append.",
              writeErr && writeErr.message
            );
          }
        } else {
          console.log(
            `module.create: admin.routes.js already contains import/routes for ${normalizedCode}`
          );
        }
      }
    } catch (fsErr) {
      console.error(
        "module.create - file creation / admin.routes update err",
        fsErr && fsErr.message
      );
      // do not fail the API call for FS issues
    }

    return res.json({ status: 1, data: m });
  } catch (err) {
    if (
      err &&
      (err.name === "SequelizeUniqueConstraintError" ||
        (err.errors && err.errors.some((e) => e.type === "unique violation")))
    ) {
      const field =
        (err.errors && err.errors[0] && err.errors[0].path) || "code";
      return res
        .status(409)
        .json({ status: 0, message: `${field} already exists.` });
    }

    console.error("module.create - unexpected error", err && err.message);
    return res
      .status(500)
      .json({ status: 0, message: "Server error while creating module." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { code, title } = req.body;

    const m = await db.Module.findByPk(id);
    if (!m)
      return res
        .status(404)
        .json({ status: 0, message: "Module not found" });

    if (
      typeof code !== "undefined" &&
      String(code).trim() &&
      String(code).trim() !== m.code
    ) {
      const normalizedCode = String(code).trim();
      const other = await db.Module.findOne({ where: { code: normalizedCode } });
      if (other && String(other.id) !== String(id)) {
        return res.status(409).json({
          status: 0,
          message: `Module code '${normalizedCode}' is already used by another module.`,
        });
      }
      m.code = normalizedCode;
      // NOTE: we do NOT automatically rename files or update admin.routes.js here.
    }

    if (typeof title !== "undefined") {
      m.title = String(title).trim() || m.title;
    }

    await m.save();
    return res.json({ status: 1, data: m });
  } catch (err) {
    if (
      err &&
      (err.name === "SequelizeUniqueConstraintError" ||
        (err.errors && err.errors.some((e) => e.type === "unique violation")))
    ) {
      const field =
        (err.errors && err.errors[0] && err.errors[0].path) || "code";
      return res
        .status(409)
        .json({ status: 0, message: `${field} already exists.` });
    }

    console.error("module.update - unexpected error", err && err.message);
    return res
      .status(500)
      .json({ status: 0, message: "Server error while updating module." });
  }
};

exports.delete = async (req, res) => {
  try {
    const d = await db.Module.destroy({ where: { id: req.params.id } });
    res.json({ status: 1, deleted: d });
  } catch (err) {
    console.error("module.delete", err && err.message);
    res.status(500).json({ status: 0, message: "Server error" });
  }
};
