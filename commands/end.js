const { SlashCommandBuilder, ContainerBuilder, ButtonStyle, MessageFlags, ButtonBuilder, ActionRow, ActionRowBuilder, CommandInteraction } = require("discord.js")
const { Sequelize, Op } = require('sequelize')
const { Users, UsersTasks, Sessions, Messages } = require('../dbObjects.js')

// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "snatcher.sqlite"
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName("end")
        .setDescription("End the game").setDescriptionLocalizations({ fr: "Termine le jeu" }),
    async execute(interaction, client){

        const containerScore = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent('AAHAHAHAHAHA ! There are the result of my sweet fellow contractors !'))
        const finalScore = await UsersTasks.findAll({ 
            where: { guild_id: interaction.guild.id },
            order: [
            ['count', 'DESC']
        ] })
        if(finalScore.length === 0){
            return interaction.reply({ content: 'No game played on this guild !', flags: MessageFlags.Ephemeral })
        }
        const userMessage = await Messages.findAll({where: { guild_id: interaction.guild.id } })
        for(let message of userMessage) {

            let channelUser = await client.channels.fetch(message.channel_id)
            let messageUser = await channelUser.messages.fetch(message.message_id)
            messageUser.delete()
            message.destroy()
        }
        // await Messages.destroy({ where: { guild_id: interaction.guild.id }})
        for(let user of finalScore) {
            let userObject = await client.users.fetch(user.user_id)
            containerScore.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`${userObject.globalName} --- ${user.count}`))
        }
        await UsersTasks.destroy({ where: { guild_id: interaction.guild.id } })
        await Sessions.destroy({ where: { guild_id: interaction.guild.id } })
        return await interaction.reply({ components: [containerScore], flags: MessageFlags.IsComponentsV2})
    }
}