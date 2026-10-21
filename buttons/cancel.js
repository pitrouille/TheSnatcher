const { Sequelize, Op } = require('sequelize')
const { UsersTasks, Tasks, Sessions } = require('../dbObjects.js')
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js')

// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "snatcher.sqlite"
})
module.exports = {
    data: {
        id: "cancel"
    },
    async pressed(interaction, client){
        
        const userId = interaction.customId.split('-')[1]
        const guildId = interaction.customId.split('-')[2]
        console.log(userId)
        const user = await UsersTasks.findOne({
            where: { user_id: userId, guild_id: guildId }
        })
        const session = await Sessions.findOne({
            where: { user_id: user.user_id, target_id: user.target_id, guild_id: user.guild_id }
        })
        if(!session) {
            return interaction.reply({ content: "You've already cancelled the killed", flags: MessageFlags.Ephemeral })
        }
        const userObject = await client.users.fetch(userId)

        const newTarget = await UsersTasks.findOne({
            where: { user_id: { [Op.ne]: user.user_id }, guild_id: user.guild_id }
        })
        const newTargetObject = await client.users.fetch(newTarget.user_id)
        const task = await Tasks.findAll({
            where: { guild_id: guildId },
            order: sequelize.random(),
            limit: 1
        })
        await user.update({ task_id: task.task_id, target_id: newTarget.user_id, count: user.count })
        await user.save()
        await session.destroy()
        //-----------------------------------------------------------------------------------------------
        // const userTarget = await UsersTasks.findOne({
        //     where: { user_id: interaction.user.id, guild_id: user.guild_id }
        // })
        // const userNewTarget = await UsersTasks.findOne({
        //     where: { user_id: { [Op.ne]: interaction.user.id }, guild_id: user.guild_id }
        // })
        // const newTargetTask = await Tasks.findAll({
        //     order: sequelize.random(),
        //     limit: 1
        // })
        // await userTarget.update({ task_id: newTargetTask.task_id, target_id: userNewTarget.user_id, count: userTarget.count })
        // await userTarget.save()
        // const newUserTargetObject= await client.users.fetch(userNewTarget.user_id)
        const kill = new ButtonBuilder().setCustomId(`kill-${guildId}`).setLabel('Confirm kill').setStyle(ButtonStyle.Success)
        const row = new ActionRowBuilder().addComponents(kill)
        // await interaction.message.delete()
        // const lastMessageUser = await userObject.dmChannel.messages.fetch({ limit: 1 })
        // await lastMessageUser.delete()

        interaction.reply({ content: `You've cancelled the kill`, flags: MessageFlags.Ephemeral})
        userObject.send({ content: `You're kill have been canceled, your next task is ${task[0].task_description}, your new target : ${newTargetObject.globalName}`, components: [row]})
        // interaction.send({ content: `Your new task is ${newTargetTask.description}, your new target is ${newUserTargetObject.globalName}`, components: [row]})
        
        // const filter = i => i.customId === "confirm"
        // const collector = interaction.channel.createMessageComponentCollector({ filter, time: 86400000 })
        

        
    }
}