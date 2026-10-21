const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping").setNameLocalizations({ fr: "ping" })
        .setDescription("Answers pong!").setDescriptionLocalizations({ fr: "Ré-pong! (haha)" }),
    async execute(interaction) {
        interaction.reply("Ping !")
    }
}
