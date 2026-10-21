module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'messages',
        {
            guild_id: DataTypes.STRING,
            user_id: DataTypes.STRING,
            channel_id: DataTypes.STRING,
            message_id: DataTypes.STRING,
            message_type: DataTypes.STRING
        },
        {
            timestamps: false,
        },
    )
}