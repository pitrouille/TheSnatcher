const { SlashCommandBuilder, ButtonStyle, MessageFlags, ButtonBuilder, ActionRowBuilder } = require("discord.js")
const { Sequelize, Op } = require('sequelize')
const { Users, Tasks, UsersTasks, Messages, Guilds } = require('../dbObjects.js')

// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "snatcher.sqlite"
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("Start the game").setDescriptionLocalizations({ fr: "Lancer le jeu" }),
    async execute(interaction) {
        const guild = await Guilds.findOne({ where: { guild_id: interaction.guild.id }})
        if(guild.isEnrolling){
           return interaction.reply({ content: 'Wait for the end of the enroll before starting the game.', flags: MessageFlags.Ephemeral})
        }
        let users = await Users.findAll({ where : { guild_id: interaction.guild.id} })
        if(users.length <=  1){
            return interaction.reply({ content: "Not enough players...", flags: MessageFlags.Ephemeral })
        }
        const task = await Tasks.findAll()
        if(task.length === 0){
            return interaction.reply("There is no task... Add task with the command /task")
        }
        for(let user of users) {
            const task = await Tasks.findAll({
                where: { guild_id: interaction.guild.id },
                order: sequelize.random(),
                limit: 1
            })
            const target = await Users.findAll({
                where: { user_id: { [Op.ne]: user.user_id }, guild_id: interaction.guild.id },
                orders: sequelize.random()
            })

            const [userTask, taskCreated] = await UsersTasks.findOrCreate({
                where: { user_id: user.user_id, guild_id: interaction.guild.id },
                defaults: {
                    guild_id: interaction.guild.id,
                    target_id: target[0].user_id,
                    user_id: user.user_id,
                    task_id: task[0].task_id,
                    count: 0,
                }
            })
            if(!taskCreated){
                return interaction.reply({ content: "The game's already started.", flags: MessageFlags.Ephemeral })
            }

            // gestion message
            const targetUserId = await interaction.guild.members.fetch(target[0].user_id)
            const userId = await interaction.guild.members.fetch(`${userTask.user_id}`)
            
            const kill = new ButtonBuilder().setCustomId(`kill-${interaction.guild.id}`).setLabel('Kill').setStyle(ButtonStyle.Danger)
            const row = new ActionRowBuilder().addComponents(kill)
            let yourTask = await Tasks.findOne({ where: { task_id: userTask.task_id } })
            const message = await userId.user.send({ content: `Your task is **${yourTask.task_description}**, your target is **${targetUserId.user.globalName}**`, components: [row]})
            await user.update({ channel_id: message.channel.id})
            await user.save()
            await Messages.create({
                guild_id: interaction.guild.id,
                user_id: userId.user.id,
                channel_id: message.channel.id,
                message_id: message.id,
                message_type: 'kill'
            })
        }
        return interaction.reply({ content: "Let's the game begin !", flags: MessageFlags.Ephemeral })
    }
}