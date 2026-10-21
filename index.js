const fs = require("node:fs")
const path = require("node:path")
require("dotenv").config()
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require("discord.js")
const { Sequelize } = require('sequelize')
const { Sessions } = require('./dbObjects.js')
const { scheduleSession } = require('./scheduler.js')



// Discord bot - init
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

// Database - init
const sequelize = new Sequelize("TheSnatcher", process.env.DB_USER, process.env.DB_PSWD, {
	host: "localhost",
	dialect: "sqlite",
	logging: false,
	storage: "snatcher.sqlite"
})



// Discord bot - registerting commands
console.log("Registering commands...")
client.commands = new Collection()
const commandsPath = path.join(__dirname, "commands")
const commandsFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"))
for (const file of commandsFiles) {
	const commandFile = path.join(commandsPath, file)
	const command = require(commandFile)
	
	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command)
		console.log(` +${command.data.name}`)
	} else {
		console.error(`Command at path ${commandFile} is incomplete : missing "data" or "execute()" property.`)
	}
}

console.log("Registering buttons...")
client.buttons = new Collection()
const buttonsPath = path.join(__dirname, "buttons")
const buttonsFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith(".js"))
for (const file of buttonsFiles){
	const buttonFile = path.join(buttonsPath, file)
	const button = require(buttonFile)

	if("data" in button && "pressed" in button){
		client.buttons.set(button.data.id, button)
		console.log(` +${button.data.id}`)
	} else {
		console.error(`Button at path ${buttonFile} is incomplete : missing "data"`)
	}
}

// Discord bot - Event handling
client.on(Events.InteractionCreate, interaction => {
	if (interaction.isChatInputCommand()) {
		console.log(`-> command "${interaction.commandName}"`)

		const command = interaction.client.commands.get(interaction.commandName)

		if (!command) return
		if (command.consoleCommand) return

		try {
			command.execute(interaction, client)
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred)
				interaction.followUp({ content: "Une erreur a été rencontrée lors de l'exécution de la commande :/", flags: MessageFlags.Ephemeral })
			else
				interaction.reply({ content: "Une erreur à été rencontrée lors de l'exécution de la commande :/", flags: MessageFlags.Ephemeral })
		}
	} else if (interaction.isAutocomplete()) {
		console.log(`-> autocomplete "${interaction.options.getFocused(true).name}" for command "${interaction.commandName}"`)

		const autocompletion = interaction.client.autocompletions.get(interaction.options.getFocused(true).name)

		if (!autocompletion)
			interaction.respond([])

		try {
			autocompletion.autocomplete(interaction)
		} catch (error) {
			console.error()
			interaction.respond([])
		}
	} else if (interaction.isModalSubmit()) {
		console.log(`-> modal "${interaction.customId.split("-")[0]}"`)

		const modal = interaction.client.modals.get(interaction.customId.split("-")[0])

		if (!modal) return

		try {
			modal.submit(interaction)
		} catch (error) {
			console.error(error)
		}
	} else if (interaction.isButton()) {
		console.log(`-> button "${interaction.customId.split("-")[0]}"`)		
		const button = interaction.client.buttons.get(interaction.customId.split('-')[0])

		try {
			button.pressed(interaction, client)
		} catch (error) {
			console.error(error)
		}
	}
	
})


// Console commands - event handling
process.stdin.on("readable", () => {
	var chunk = process.stdin.read()
	if (chunk !== null) {
		let input = "" + chunk
		const args = input.split("\r")[0].split("\n")[0].split(" ")
		const commandName = args.shift().toLowerCase()

		const command = client.commands.get(commandName)

		if (!command || !command.consoleCommand) {
			process.stdin.resume()
			return
		}

		try {
			command.execute(args, command.needsClient?client:undefined)
		} catch (err) {
			console.error(err)
		}

		process.stdin.resume()
	}
})

// Discord bot - connection
client.once(Events.ClientReady, async (readyClient) => {
	console.log(`TheSnatcher is ready ! Logged in as ${readyClient.user.tag}`)
	// Get Session
	const sessions = await Sessions.findAll()
	if(sessions.length >0){
		sessions.forEach(session => {
			scheduleSession(session, client)
		})
	}
})

client.login(process.env.DISCORD_TOKEN)
.then(console.log("TheSnatcher is connected to the interwebs"))



module.exports = client