
module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'tasks',
        {
            task_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            task_description: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            guild_id: DataTypes.STRING,
            
        },
        {
            timestamps: false,
        }
    )
}