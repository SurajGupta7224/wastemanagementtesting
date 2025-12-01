// src/models/users.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  id: { 
    type: 
    DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  role_id: {
     type: DataTypes.INTEGER 
  },
  username: { 
    type: DataTypes.STRING(255) 
  },
  email: { 
    type: DataTypes.STRING(255), 
    unique: true 
  },
  password: { 
    type: DataTypes.STRING(255) 
  },
  otp: { 
    type: DataTypes.STRING(10), 
    allowNull: true 
  },
  otp_expiry: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
  status: { 
    type: DataTypes.INTEGER, defaultValue: 1 
  },
  created_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, {
  tableName: "users",
  timestamps: false
});

module.exports = User;
