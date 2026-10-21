const { Sequelize, Op } = require('sequelize')
const { Users, UsersTasks, Tasks } = require('../dbObjects.js')
const { MessageFlags } = require('discord.js')

// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "snatcher.sqlite"
})

module.exports = {
    data: {
        id: "enroll"
    },
    async pressed(interaction, client){
        const [user, userCreated] = await Users.findOrCreate({
            where: { user_id: interaction.user.id },
            defaults : { user_id: interaction.user.id, guild_id: interaction.guild.id }
        })
        if(userCreated){
            return interaction.reply({ content: "That seals the deal ! We're in business !", flags: MessageFlags.Ephemeral })
        } else {
            return interaction.reply({ content: "You've already sign my contract ! There or in an other guild.", flags: MessageFlags.Ephemeral })
        }
        
    }
        
}