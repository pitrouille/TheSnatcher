module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'users',
        {
            user_id: DataTypes.STRING,
            guild_id: DataTypes.STRING,
            channel_id: DataTypes.STRING
        },
        {
            timestamps: false,
        },
    )
}