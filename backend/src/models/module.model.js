module.exports = (sequelize, DataTypes) => {
  const Module = sequelize.define(
    "Module",
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      code: { 
        type: DataTypes.STRING(100), 
        allowNull: false, unique: true 

      },
      title: { 
        type: DataTypes.STRING(150), 
        allowNull: false 

      },
      created_at: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
      },
    },
    { tableName: "modules", timestamps: false }
  );
  return Module;
};

