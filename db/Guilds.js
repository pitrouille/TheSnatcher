module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'guilds',
        {
            guild_id: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            isEnrolling: {
                type: DataTypes.BOOLEAN
            }
        },
        {
            timestamps: false,
        }
    )
}