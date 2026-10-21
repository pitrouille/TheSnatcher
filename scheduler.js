const { Sequelize, Op } = require("sequelize")
const { UsersTasks, Tasks, Sessions, Messages } = require("./dbObjects")
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js')
const schedule = require('node-schedule')

// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "snatcher.sqlite"
})

async function scheduleSession(session, client) {

    const kill = schedule.scheduleJob(session.end_time, async function(){
        if(session){
            const userObject = await client.users.fetch(session.user_id)
            const targetObject = await client.users.fetch(session.target_id)
            const guildId = session.guild_id
            const user = await UsersTasks.findOne({
                where: { guild_id: guildId, user_id: session.user_id }
            })
            const target = await UsersTasks.findOne({
                where: { user_id: session.target_id, guild_id: guildId}
            })
            const newTarget = await UsersTasks.findOne({
                where: { user_id: { [Op.ne]: session.user_id }, guild_id: guildId }
            })
            const newTargetObject = await client.users.fetch(newTarget.user_id)
            user.count = user.count + 1
            await user.update({ task_id: target.task_id, target_id: newTarget.user_id, count: user.count })
            await user.save()
            const task = await Tasks.findOne({ where: { task_id: target.task_id} })

            //--------------------------------------------------------------------------------
            const newTask = await Tasks.findAll({ where: { guild_id: guildId }, order: sequelize.random(), limit: 1})
            const newTargetTarget = await UsersTasks.findOne({ where: { guild_id: guildId, user_id : { [Op.ne]: target.user_id } } })
            const newTargetTargetObject = await client.users.fetch(newTargetTarget.user_id)
            target.count = target.count - 1
            await target.update({ target_id: newTargetTarget.user_id, task_id: newTask[0].task_id, count: target.count})
            await target.save()
            const killButton = new ButtonBuilder().setCustomId(`kill-${user.guild_id}`).setLabel('Kill').setStyle(ButtonStyle.Danger)
            const row = new ActionRowBuilder().addComponents(killButton)
            // Gestion message
            const newMessageUser = await userObject.send({ content: `Your kill has been confirmed, your next task is **${task.task_description}**, your new target : **${newTargetObject.globalName}**`, components: [row] })
            const newMessageTarget = await targetObject.send({ content: `You've been killed, your new task is **${newTask[0].task_description}**, your new target is **${newTargetTargetObject.globalName}**`, components: [row] })
            session.destroy()
            //Suppression old message of the killer
            const userMessage = await Messages.findOne({ where: { user_id: userObject.id, message_type: 'kill' } })
            const channelUser = await client.channels.fetch(userMessage.channel_id)
            const lastMessageUser = await channelUser.messages.fetch(userMessage.message_id)
            lastMessageUser.delete()

            const targetConfirmMessage = await Messages.findOne({ where: { user_id: targetObject.id, message_type: 'confirm' } })
            const channelTarget = await client.channels.fetch(targetConfirmMessage.channel_id)
            const lastMessageTarget = await channelTarget.messages.fetch(targetConfirmMessage.message_id)
            lastMessageTarget.delete()
            // modif + suppr message bdd
            await Messages.create({ guild_id: guildId, user_id: targetObject.id, channel_id: newMessageTarget.channelId, message_id: newMessageTarget.id, message_type: 'kill'})
            await Messages.update({ message_id: newMessageUser.id }, { where: { user_id: userObject.id, message_type: 'kill' } })
            await Messages.destroy({ where: { user_id: targetObject.id, message_type: 'confirm' } })
        }else{
            console.log("The session has already been confirmed")
        }
    })
    
}



module.exports = { scheduleSession }
