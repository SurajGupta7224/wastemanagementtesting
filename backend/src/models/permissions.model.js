module.exports = (sequelize, DataTypes) => {
    const Permission = sequelize.define(
        "Permission",
        {
            id: { 
                type: DataTypes.INTEGER, 
                primaryKey: true, 
                autoIncrement: true 
                
            },
            module_id: { 
                type: DataTypes.INTEGER, 
                allowNull: false 
                
            },
            action_id: { 
                type: DataTypes.INTEGER, 
                allowNull: false 
                
            },
            permission_key: {
                type: DataTypes.STRING(200),
                allowNull: false,
                unique: true,
            },
            label: { 
                type: DataTypes.STRING(200) 
                
            },
            created_at: { 
                type: DataTypes.DATE, 
                defaultValue: DataTypes.NOW 
                
            },
        },
        { tableName: "permissions", timestamps: false }
    );
    return Permission;
};
