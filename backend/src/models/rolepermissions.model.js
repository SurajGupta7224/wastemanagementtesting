// backend/src/models/rolepermission.model.js
module.exports = (sequelize, DataTypes) => {
  const RolePermission = sequelize.define(
    "RolePermission",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: "id",
      },
      // JS attr name role_id mapped to DB column "role_id"
      role_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "role_id",
      },
      // JS attr name permission_id mapped to DB column "permission_id"
      permission_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "permission_id",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "created_at",
      },
    },
    {
      tableName: "role_permissions",    // exact table name in your DB
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["role_id", "permission_id"],
          name: "unique_role_permission",
        },
      ],
    }
  );

  RolePermission.associate = (models) => {
    if (models.Role) {
      RolePermission.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role",
      });
    }
    if (models.Permission) {
      RolePermission.belongsTo(models.Permission, {
        foreignKey: "permission_id",
        as: "permission",
      });
    }
  };

  return RolePermission;
};
