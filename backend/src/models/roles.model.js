module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define(
        "Role",
        {
            id: { 
                type: DataTypes.INTEGER, 
                primaryKey: true, 
                autoIncrement: true 

            },
            name: { 
                type: DataTypes.STRING(100), 
                allowNull: false, 
                unique: true },
            description: { 
                type: DataTypes.STRING(255) 

            },
            status: { 
                type: DataTypes.TINYINT, defaultValue: 1 
            },
            created_at: { 
                type: DataTypes.DATE, 
                defaultValue: DataTypes.NOW 
            },
        },
        { tableName: "roles", timestamps: false }
    );
    return Role;
};
