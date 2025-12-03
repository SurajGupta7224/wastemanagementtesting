// backend/src/utils/fileHelper.js
const path = require("path");
const fs = require("fs").promises;
const { existsSync } = require("fs");

function pascalCase(str) {
  return String(str)
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(s => s[0].toUpperCase() + s.slice(1).toLowerCase())
    .join("");
}

async function safeWriteFile(filePath, content) {
  try {
    if (existsSync(filePath)) {
      return { ok: false, reason: "exists" };
    }
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf8");
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "err", err };
  }
}

module.exports = {
  safeWriteFile,
  pascalCase,
};
