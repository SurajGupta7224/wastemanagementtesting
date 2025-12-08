require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    timezone: "+05:30",
  }
);

// Test Connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("🔥 Database Connected Successfully!");
  } catch (err) {
    console.error("❌ Database Connection Error:");
    console.error("Message:", err.message);
    console.error("Full Error:", err);
  }
})();

module.exports = sequelize;
