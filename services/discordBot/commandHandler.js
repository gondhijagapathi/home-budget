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

module.exports = {
    registerCommand,
    handleCommand,
    commands // Exporting for help command
};
