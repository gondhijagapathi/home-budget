module.exports = {
    init: (registerCommand, commandsMap) => {
        registerCommand(
            'ping',
            async (message) => {
                const sent = await message.reply('Pinging...');
                const latency = sent.createdTimestamp - message.createdTimestamp;
                await sent.edit(`Pong! Latency is ${latency}ms. API Latency is ${Math.round(message.client.ws.ping)}ms.`);
            },
            'Checks the bot\'s latency.'
        );

        registerCommand(
            'help',
            async (message) => {
                let helpText = '**Available Commands:**\n';
                commandsMap.forEach((cmd, name) => {
                    helpText += `**!${name}**: ${cmd.description}\n`;
                });
                await message.reply(helpText);
            },
            'Lists all available commands.'
        );

        registerCommand(
            'logs',
            async (message, args) => {
                // Simple implementation: fetch last 5 entries from report_logs
                const db = require('../../../models/dbConnection');
                try {
                    const logs = await db('SELECT * FROM report_logs ORDER BY timestamp DESC LIMIT 5');
                    if (logs.length === 0) {
                        await message.reply('No logs found.');
                        return;
                    }
                    let response = '**Recent Logs:**\n';
                    logs.forEach(log => {
                        response += `[${new Date(log.timestamp).toLocaleString()}] ${log.reportType}\n`;
                    });
                    await message.reply(response);
                } catch (err) {
                    console.error(err);
                    await message.reply('Error fetching logs.');
                }
            },
            'Shows the last 5 report logs.'
        );
    }
};
