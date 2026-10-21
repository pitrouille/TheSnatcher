module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'user_task',
        {
            user_id: DataTypes.STRING,
            guild_id: DataTypes.STRING,
            task_id: DataTypes.INTEGER,
            target_id: DataTypes.STRING,
            count: DataTypes.INTEGER
        },
        {
            timestamps: false,
        }
    )
}