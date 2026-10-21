const { SlashCommandBuilder, MessageFlags } = require('discord.js')
const Sequelize = require('sequelize')
const { Tasks, Guilds } = require('../dbObjects')


// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "snatcher.sqlite"
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName('task')
        .setDescription('Create a new task').setDescriptionLocalizations({ fr: "Création d'une nouvelle tache"})
        .addStringOption((option) => 
            option  
                .setName('task')
                .setDescription('Your task')
                .setRequired(true)
                .setDescriptionLocalizations({ fr: 'Ta tache' })
        ),
        async execute(interaction) {
            Guilds.findOrCreate({
                where: { guild_id: interaction.guild.id },
                default: { guild_id: interaction.guild.id }
            })
            Tasks.create({
                task_description: interaction.options.getString('task'),
                guild_id: interaction.guild.id
            }).then(interaction.reply({ content: "Task created", flags: MessageFlags.Ephemeral }))
        }
}