const { Sequelize, Op } = require('sequelize')
const { UsersTasks, Tasks, Sessions, Users, Messages } = require('../dbObjects.js')
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, MessageFlags } = require('discord.js')

// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "snatcher.sqlite"
})
module.exports = {
    data: {
        id: "confirm"
    },
    async pressed(interaction, client){
        
        const userId = interaction.customId.split('-')[1]
        const guildId = interaction.customId.split('-')[2]
        
        const user = await UsersTasks.findOne({
            where: { user_id: userId, guild_id: guildId }
        })
        const session = await Sessions.findOne({
            where: { user_id: user.user_id, target_id: user.target_id, guild_id: user.guild_id }
        })
        if(!session) {
            return interaction.reply({ content: "You've already confirmed the killed", flags: MessageFlags.Ephemeral })
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
        user.count = user.count + 1
        await user.update({ task_id: task.task_id, target_id: newTarget.user_id, count: user.count })
        await user.save()
        //-----------------------------------------------------------------------------------------------
        const userTarget = await UsersTasks.findOne({
            where: { user_id: interaction.user.id, guild_id: user.guild_id }
        })
        const userNewTarget = await UsersTasks.findOne({
            where: { user_id: { [Op.ne]: interaction.user.id }, guild_id: user.guild_id }
        })
        const newTargetTask = await Tasks.findAll({
            where: { guild_id: guildId },
            order: sequelize.random(),
            limit: 1
        })
        userTarget.count =  userTarget.count - 1
        await userTarget.update({ task_id: newTargetTask.task_id, target_id: userNewTarget.user_id, count: userTarget.count })
        await userTarget.save()
        await session.destroy()
        const newUserTargetObject = await client.users.fetch(userNewTarget.user_id)
        const kill = new ButtonBuilder().setCustomId(`kill-${user.guild_id}`).setLabel('Kill').setStyle(ButtonStyle.Danger)
        const row = new ActionRowBuilder().addComponents(kill)
        // const lastMessageUser = await userObject.dmChannel.messages.fetch({ limit: 1 })
        // lastMessageUser.delete()

        // const lastMessages = await interaction.channel.messages.fetch({ limit: 2 })
        // lastMessages.forEach(message => {
        //     message.delete()
        // });
        const messageUser = await Messages.findOne({ where: { user_id: interaction.user.id, message_type: 'confirm' } })
        const messageTarget = await Messages.findOne({ where: { user_id: userId, message_type: 'kill' }})

        let messageUserObject = await interaction.message.fetch(messageUser.message_id)
        messageUserObject.delete()
        const channelTargetObject = await client.channels.fetch(messageTarget.channel_id)
        const messageTargetObject = await channelTargetObject.messages.fetch(messageTarget.message_id)
        messageTargetObject.delete()
        const newMessageTarget = await userObject.send({ content: `Your kill has been confirmed, your next task is **${task[0].task_description}**, your new target : **${newTargetObject.globalName}**`, components: [row]})
        const newMessageUser = await interaction.user.send({ content: `Your new task is **${newTargetTask[0].task_description}**, your new target is **${newUserTargetObject.globalName}**`, components: [row]})
        await Messages.create({guild_id: guildId, user_id: interaction.user.id, channel_id: messageUser.channel_id, message_id: newMessageUser.id, message_type: 'kill' })
        await Messages.update({ message_id: newMessageTarget.id }, { where: { user_id: messageTarget.user_id, message_type: 'kill' } })
        await Messages.destroy({ where: { user_id: messageUser.user_id, message_type: 'confirm' }})
        await interaction.reply({content: "Confirm send", flags: MessageFlags.Ephemeral})

        // const filter = i => i.customId === "confirm"
        // const collector = interaction.channel.createMessageComponentCollector({ filter, time: 86400000 })
        

        
    }
}