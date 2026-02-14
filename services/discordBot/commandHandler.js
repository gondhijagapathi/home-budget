const fs = require('fs');
const path = require('path');

// Map to store commands
const commands = new Map();

/**
 * Register a command
 * @param {string} name - Command name (e.g., 'ping')
 * @param {function} execute - Function to execute (message, args) => Promise<void>
 * @param {string} description - Description for help command
 */
function registerCommand(name, execute, description) {
    commands.set(name, { execute, description });
}

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const commandModule = require(filePath);
        if (commandModule.init) {
            commandModule.init(registerCommand, commands);
        }
        // Also register slash command builder if present
        if (commandModule.slashBuilder) {
            commands.set(commandModule.slashBuilder.name, commandModule);
        }
    }
}

/**
 * Handle incoming messages
 * @param {object} message - Discord message object
 */
async function handleCommand(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check if message starts with prefix
    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    // Check Management Channel
    const managementChannelId = process.env.DISCORD_MANAGEMENT_CHANNEL_ID;
    if (managementChannelId && message.channel.id !== managementChannelId) {
        // Optionally ignore or reply "Wrong channel"
        // For security/noise reduction, it's often best to ignore or send a DM.
        // Let's ignore for now to avoid spam in other channels.
        return;
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(`[Command] Error executing ${commandName}:`, error);
        await message.reply('There was an error executing that command.');
    }
}

const { REST, Routes, MessageFlags } = require('discord.js');

// ... (existing code)

/**
 * Handle incoming interactions (Slash Commands, Buttons, Modals)
 * @param {object} interaction - Discord interaction object
 */
async function handleInteraction(interaction) {
    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);
        if (!command) return;

        try {
            if (command.executeInteraction) {
                await command.executeInteraction(interaction);
            } else {
                await interaction.reply({ content: 'This command does not support slash interactions yet.', flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error(`[Interaction] Error executing ${interaction.commandName}:`, error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error executing this command!', flags: MessageFlags.Ephemeral });
                }
            } catch (err) {
                console.error('[Interaction] Failed to send error message:', err);
            }
        }
    } else if (interaction.isStringSelectMenu() || interaction.isButton() || interaction.isModalSubmit()) {
        // Find command that handles this interaction
        // Convention: customId starts with "commandName_"
        // Since command names can contain underscores, we should iterate or use a more robust check.

        let command = null;
        for (const [name, cmd] of commands.entries()) {
            if (interaction.customId.startsWith(name + '_')) {
                command = cmd;
                break;
            }
        }

        if (command && command.handleComponent) {
            try {
                await command.handleComponent(interaction);
            } catch (error) {
                console.error(`[Interaction] Error handling component ${interaction.customId}:`, error);
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: 'Error processing interaction.', flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.followUp({ content: 'Error processing interaction.', flags: MessageFlags.Ephemeral });
                    }
                } catch (err) {
                    console.error('[Interaction] Failed to send component error message:', err);
                }
            }
        }
    }
}

async function registerSlashCommands(client) {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    const slashCommands = [];

    commands.forEach((cmd, name) => {
        if (cmd.slashBuilder) {
            slashCommands.push(cmd.slashBuilder.toJSON());
        }
    });

    try {
        console.log(`[Discord] Started refreshing ${slashCommands.length} application (/) commands.`);

        // Use Global Commands for production, Guild Commands for dev (instant update)
        // For now, let's try to register globally if we want, or just log it. 
        // Better: Register to all guilds the bot is in? Or just global. 
        // Global takes 1hr to update. Let's use Guild registration for the first guild we find or Env var.

        // Actually, let's just use Global for simplicity in this updating context
        // OR better: iterate over all guilds.
        const guildIds = client.guilds.cache.map(guild => guild.id);

        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guildId),
                { body: slashCommands },
            );
        }

        console.log(`[Discord] Successfully reloaded application (/) commands.`);
    } catch (error) {
        console.error('[Discord] Error refreshing application (/) commands:', error);
    }
}

module.exports = {
    registerCommand,
    handleCommand,
    handleInteraction,
    registerSlashCommands,
    commands // Exporting for help command
};
