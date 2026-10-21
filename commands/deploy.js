const { REST, Routes } = require("discord.js")

module.exports = {
	data: {
		name: "deploy"
	},
	consoleCommand: true,
	needsClient: true,
	async execute(args, client) {
		const action = args.shift()

		if (action == "help") {
			console.log("Usage :")
			console.log("deploy add|update|delete <commandName> [<otherCommandName>...]")
			console.log("deploy list [guildId]")
			console.log("Guild specifics commands:")
			console.log("deploy add-guild|update-guild|delete-guild <guildId> <commandName> [<otherCommandName>...]")
		} else if (action == "add" || action == "add-guild") {
			let guildId
			if (action == "add-guild")
				guildId = args.shift()
			
			console.log(`> Deploying commands ${args.join(", ")} ${guildId ? `for guild ${guildId}` : ""}`)
			let commandsInfo = getCommandsInfo(client, args)
			
			if (commandsInfo) {
				console.log(` > fetching current application ${guildId ? "guild" : ""} commands...`)
				const rest = new REST().setToken(process.env.DISCORD_TOKEN)
				getCurrentAppCommands(rest, client, guildId)
				.then(existingCommands => {
					let nbExistingCommands = existingCommands.length
					console.log(`Found ${nbExistingCommands} already deployed commands. Fetching existing commands infos...`)
					for (let commandToDeploy of commandsInfo)
						for (let existingCommand of existingCommands)
							if (commandToDeploy.name == existingCommand.name)
								existingCommands.pop(existingCommand)
					if (nbExistingCommands == 0 || existingCommands.length > 0) {
						let existingCommandsInfo = getCommandsInfo(client, existingCommands.map(cmd => cmd.name)) ?? new Array()
						let appCommandsInfo = existingCommandsInfo.concat(commandsInfo)

						if (guildId)
							rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: appCommandsInfo })
							.then((data) => console.log(` ✓ successfuly registered new application guild commands.`))
							.catch(console.error)
						else
							rest.put(Routes.applicationCommands(client.user.id), { body: appCommandsInfo })
							.then(data => console.log(` ✓ successfuly registered new application commands.`))
					} else {
						console.log(`All passed commands (${args}) are already deployed ${guildId ? `in guild ${guildId}` : ""}. Use update command instead.`)
					}
				})
			}
		} else if (action == "update" || action == "update-guild" || action == "delete" || action == "delete-guild") {
			let guildId
			if (action == "update-guild" || action == "delete-guild")
				guildId = args.shift()

			let commandsInfo = getCommandsInfo(client, args)

			if (commandsInfo) {
				const rest = new REST().setToken(process.env.DISCORD_TOKEN)
				console.log(` > fetching current application ${guildId ? "guild" : ""} commands...`)
				getCurrentAppCommands(rest, client, guildId)
				.then(existingCommands => {
					for (let commandInfo of commandsInfo) {
						let existingCommand = existingCommands.find(cmd => cmd.name == commandInfo.name)

						if (existingCommand) {
							console.log(" > found guild command " + commandInfo.name)

							if (action == "update" || "update-guild") {
								console.log("Updating command " + commandInfo.name)
								if (guildId)
									rest.patch(Routes.applicationGuildCommand(client.user.id, guildId, existingCommand.id), { body: commandInfo })
									.then(console.log(" ✓ command " + commandInfo.name + " updated for guild " + guildId))
									.catch(console.error)
								else
									rest.patch(Routes.applicationCommand(client.user.id, existingCommand.id), { body: commandInfo })
									.then(console.log(" ✓ command " + commandInfo.name + " updated"))
									.catch(console.error)
							} else if (action == "delete" || "delete-guild") {
								console.log("Deleting command " + commandInfo.name)
								if (guildId)
									rest.delete(Routes.applicationGuildCommand(client.user.id, guildId, existingCommand.id))
									.then(console.log(" ✓ command " + commandInfo.name + " deleted for guild " + guildId))
									.catch(console.error)
								else
									rest.delete(Routes.applicationCommand(client.user.id, existingCommand.id))
									.then(console.log(" ✓ command " + commandInfo.name + " deleted"))
									.catch(console.error)
							}
						} else {
							console.log(" ✗ no guild command " + commandInfo.name + " for guild " + guildId)
						}
					}
				})
			}
		} else if (action == "list") {
			let guildId = args.shift()
			
			const rest = new REST({ version: 10 }).setToken(process.env.DISCORD_TOKEN)

			console.log(" > getting commands" + (guildId ? " for guild " + guildId:""))
			getCurrentAppCommands(rest, client, guildId)
			.then(res => {
				if (res.length > 0) {
					console.log(guildId ? `Commands for guild ${guildId} :` : "Global commands :")
					for (let command of res)
						console.log(` - ${command.name} (${command.id})`)
				} else {
					console.log(`No commands found ${guildId ? `for guild ${guildId}` : ""}`)
				}
			})
		}
	}
}

function getCommandsInfo(client, commandsName) {
	let commandsInfo = new Array()
	for (let commandName of commandsName) {
		let command = client.commands.get(commandName)

		if (!command) {
			console.log(` - couldn't find data for command ${commandName}`)
		} else {
			console.log(` + local data found for command ${commandName}`)
			commandsInfo.push(command.data)
		}
	}

	if (commandsInfo.length > 0)
		return commandsInfo
	else
		return null
}

async function getCurrentAppCommands(rest, client, guildId) {
	if (guildId)
		return await rest.get(Routes.applicationGuildCommands(client.user.id, guildId))
	else
		return await rest.get(Routes.applicationCommands(client.user.id))
}
