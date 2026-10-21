module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'sessions',
        {
            guild_id: DataTypes.STRING,
            user_id: DataTypes.STRING,
            target_id: DataTypes.STRING,
            task_id: DataTypes.INTEGER,
            start_time: DataTypes.DATE,
            end_time: DataTypes.DATE
        },
        {
            timestamps: false,
        }
    )
}