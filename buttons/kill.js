const { Sequelize, Op } = require('sequelize')
const { UsersTasks, Tasks, Sessions, Messages } = require('../dbObjects.js')
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js')
const schedule = require('node-schedule')

// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "snatcher.sqlite"
})
module.exports = {
    data: {
        id: "kill"
    },
    async pressed(interaction, client){
        const guildId = interaction.customId.split('-')[1]
        const user = await UsersTasks.findOne({
            where: { user_id: interaction.user.id, guild_id: guildId }
        })
        const task = await Tasks.findOne({
            where: { task_id: user.task_id }
        })
        const targetObject = await client.users.fetch(user.target_id)
        const startTime = new Date()
        const endTime = new Date()
        endTime.setDate(endTime.getDate() + 1)
        const [session, created] = await Sessions.findOrCreate({
            where: { user_id: interaction.user.id, target_id: user.target_id, guild_id: guildId, task_id: user.task_id },
            defaults: { 
                guild_id: guildId,
                user_id: interaction.user.id,
                target_id: user.target_id,
                task_id: task.task_id,
                start_time: startTime,
                end_time: endTime
            }
        })
        if(!created) {
            return interaction.reply({ content:"You've already send your kill", flags: MessageFlags.Ephemeral })
        }
        const kill = schedule.scheduleJob(endTime , async function() {
            const session = await Sessions.findOne({
                where: { guild_id: guildId, user_id: interaction.user.id, target_id: user.target_id, task_id: user.task_id}
            })
            if(session){
                const target = await UsersTasks.findOne({
                    where: { guild_id: guildId, user_id: user.target_id }
                })
                const newTargetTask = await Tasks.findAll({
                    where: { guild_id: guildId },
                    order: sequelize.random(),
                    limit: 1
                })
                const newTarget = await UsersTasks.findOne({
                    where: { user_id: { [Op.ne]: interaction.user.id }, guild_id: guildId }
                })
                user.count = user.count + 1
                await user.update({
                    target_id: newTarget.user_id,
                    task_id: target.task_id,
                    count: user.count 
                })
                const newTargetTarget = await UsersTasks.findOne({
                    where: { user_id: { [Op.ne]: target.user_id }, guild_id: guildId }
                })
                target.count = target.count - 1
                
                const newUserTask = await Tasks.findOne({ where: { task_id: target.task_id }})
                await target.update({
                    target_id: newTargetTarget.user_id,
                    task_id: newTargetTask[0].task_id,
                    count: target.count
                })
                const newTargetTargetObject = await client.users.fetch(newTargetTarget.user_id)
                const newTargetObject = await client.users.fetch(newTarget.user_id)
                const userObject = await client.users.fetch(session.user_id)
                user.save()
                target.save()
                session.destroy()
                // Gestion message
                const killButton = new ButtonBuilder().setCustomId(`kill-${user.guild_id}`).setLabel('Kill').setStyle(ButtonStyle.Danger)
                const row = new ActionRowBuilder().addComponents(killButton)
                const newMessageTarget = await targetObject.send({ content: `You've been killed, your new task is **${newTargetTask[0].task_description}** and your target is **${newTargetTargetObject.globalName}**`, components: [row] })
                const newMesssageUser = await userObject.send({ content: `Your kill has been confirmed, your new task is **${newUserTask.task_description}**, your new target is **${newTargetObject.globalName}**`, components: [row]})
                //Suppression old message of the killer
                const userMessage = await Messages.findOne({ where: { user_id: userObject.id, message_type: 'kill' } })
                const lastMessageUser = await interaction.message.fetch(userMessage.message_id)
                lastMessageUser.delete()
                const targetConfirmMessage = await Messages.findOne({ where: { user_id: targetObject.id, message_type: 'confirm' } })
                const channelTarget = await client.channels.fetch(targetConfirmMessage.channel_id)
                const lastMessageTarget = await channelTarget.messages.fetch(targetConfirmMessage.message_id)
                lastMessageTarget.delete()
                // deleteMessage(userObject, userMessage.message_id, userMessage.channel_id)

                // Modification + suppression Message
                await Messages.create({guild_id: guildId, user_id: targetObject.id, channel_id: newMessageTarget.channelId, message_id: newMessageTarget.id, message_type: 'kill' })
                await Messages.update({ message_id: newMesssageUser.id }, { where: { user_id: userObject.id, message_type: 'kill' } })
                await Messages.destroy({ where: { user_id: targetObject.id, message_type: 'confirm' }})
            }

        })
        // Gestion message
        const confirm = new ButtonBuilder().setCustomId(`confirm-${interaction.user.id}-${guildId}`).setLabel('Confirm').setStyle(ButtonStyle.Danger)
        const row = new ActionRowBuilder().addComponents(confirm)

        interaction.reply({ content: 'Kill send !', flags: MessageFlags.Ephemeral})
        // Suppression of the killed old message
        let targetOldMessage = await Messages.findOne({ where: { user_id: targetObject.id, message_type: 'kill' } })
        let channelTargetObject = await client.channels.fetch(targetOldMessage.channel_id)
        let messageTargetObject = await channelTargetObject.messages.fetch(targetOldMessage.message_id)
        targetOldMessage.destroy()
        messageTargetObject.delete()
        const targetMessage = await targetObject.send({ content: `You've been killed by **${interaction.user.globalName}** with the task : **${task.task_description}**. Is it true ?`, components: [row]})
        await Messages.create({ guild_id: guildId, user_id: user.target_id, channel_id: targetMessage.channelId, message_id: targetMessage.id, message_type: 'confirm'})
    }
}

