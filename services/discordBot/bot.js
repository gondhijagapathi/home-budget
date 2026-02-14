const { Client, GatewayIntentBits, Events } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, () => {
    console.log(`[Discord] Bot logged in as ${client.user.tag}`);
});

const { handleCommand } = require('./commandHandler');

client.on('messageCreate', handleCommand);

async function sendMessage(message) {
    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (!channelId) {
        console.error('[Discord] DISCORD_CHANNEL_ID is not set in .env');
        return;
    }

    try {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
            // Discord has a 2000 character limit per message.
            // Split message if it's too long
            const maxLength = 2000;
            if (message.length > maxLength) {
                // Split message if it's too long
                for (let i = 0; i < message.length; i += maxLength) {
                    const chunk = message.slice(i, i + maxLength);
                    await channel.send(chunk);
                }
            } else {
                await channel.send(message);
            }
            console.log('[Discord] Message sent successfully');
        } else {
            console.error('[Discord] Channel not found');
        }
    } catch (error) {
        console.error('[Discord] Error sending message:', error);
    }
}

module.exports = {
    client,
    sendMessage
};
