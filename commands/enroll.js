const { SlashCommandBuilder, ContainerBuilder, ButtonStyle, MessageFlags } = require("discord.js")
const Sequelize = require('sequelize')
const { Guilds, UsersTasks } = require('../dbObjects.js')

// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "snatcher.sqlite"
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName("enroll")
        .setDescription("Create a trap").setDescriptionLocalizations({ fr: "Installation du piège" }),
    async execute(interaction) {
        const contractContainer = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents((textDisplay) => 
                textDisplay.setContent(
                    "AHAHAHAHAHA ! YOU FOOOOOOOOOOOOOOOOOOOOL ! YOU'VE FALLEN INTO MY TRAP"
                ),
            )
            .addSeparatorComponents((separator) => separator)
            .addSectionComponents((section) =>
                section
                    .addTextDisplayComponents(
                        (textDisplay) =>
                            textDisplay.setContent(
                                'Sign the contract'
                            )
                    )
                    .setButtonAccessory((button) =>
                        button.setCustomId('enroll').setLabel('Sign Contract').setStyle(ButtonStyle.Primary)
                    )
                )
        const endContractContainer = new ContainerBuilder()
            .setAccentColor(0xff0000)
            .addTextDisplayComponents((textDisplay) => 
                textDisplay.setContent(
                    "My contract as expired... To start the game, enter the command /start"
                ),
            )
        const [guild, guildCreated] = await Guilds.findOrCreate({ where: { guild_id: interaction.guild.id }, default: { guild_id: interaction.guild.id } })
        await guild.update({isEnrolling: true})
        const isStart = await UsersTasks.findOne({ where: { guild_id: interaction.guild.id } })
        if(isStart){
            return interaction.reply('A game is already started, wait for the end of the game to enroll new player')
        }
        await interaction.reply({
            components: [contractContainer],
            flags: [MessageFlags.IsComponentsV2],
            withResponse: true
        })
        const collector = interaction.channel.createMessageComponentCollector({
            time: "1800000"
        })

        collector.on('end', async collected => {
            guild.update({isEnrolling: false})
            return interaction.editReply({
                components: [endContractContainer],
                flags: [MessageFlags.IsComponentsV2]
            })
        })
    }
}