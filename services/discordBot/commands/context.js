const db = require('../../../models/dbConnection');

module.exports = {
    init: (registerCommand) => {
        registerCommand(
            'context',
            async (message, args) => {
                // Usage: !context set <key> <content> | !context delete <key> | !context list

                if (!args[0]) {
                    await message.reply('Usage: `!context set <key> <content>` or `!context delete <key>` or `!context list`');
                    return;
                }

                const subCommand = args[0].toLowerCase();

                if (subCommand === 'set') {
                    // !context set goal I want to save for a car
                    if (args.length < 3) {
                        await message.reply('Usage: `!context set <key> <content>`');
                        return;
                    }
                    const key = args[1];
                    const content = args.slice(2).join(' ');

                    try {
                        // Upsert logic: INSERT INTO ... ON DUPLICATE KEY UPDATE
                        const query = `
                            INSERT INTO advisor_context (contextKey, content) 
                            VALUES (?, ?) 
                            ON DUPLICATE KEY UPDATE content = VALUES(content)
                        `;
                        await db(query, [key, content]);
                        await message.reply(`Context **${key}** saved successfully.`);
                    } catch (err) {
                        console.error(err);
                        await message.reply('Error saving context.');
                    }

                } else if (subCommand === 'delete') {
                    // !context delete goal
                    if (args.length < 2) {
                        await message.reply('Usage: `!context delete <key>`');
                        return;
                    }
                    const key = args[1];

                    try {
                        const result = await db('DELETE FROM advisor_context WHERE contextKey = ?', [key]);
                        if (result.affectedRows > 0) {
                            await message.reply(`Context **${key}** deleted.`);
                        } else {
                            await message.reply(`Context **${key}** not found.`);
                        }
                    } catch (err) {
                        console.error(err);
                        await message.reply('Error deleting context.');
                    }

                } else if (subCommand === 'list') {
                    try {
                        const rows = await db('SELECT contextKey, content FROM advisor_context ORDER BY contextKey');
                        if (rows.length === 0) {
                            await message.reply('No context set.');
                            return;
                        }

                        let response = '**Advisor Context:**\n';
                        rows.forEach(row => {
                            // Truncate content if too long for list view
                            const preview = row.content.length > 50 ? row.content.substring(0, 47) + '...' : row.content;
                            response += `- **${row.contextKey}**: ${preview}\n`;
                        });

                        // Handle discord message limit
                        if (response.length > 2000) {
                            response = response.slice(0, 1900) + '... (truncated)';
                        }
                        await message.reply(response);

                    } catch (err) {
                        console.error(err);
                        await message.reply('Error listing context.');
                    }

                } else {
                    await message.reply('Unknown subcommand. Usage: `!context set|delete|list ...`');
                }
            },
            'Manage persistent context for the AI Advisor. Usage: `!context set <key> <text>`, `!context delete <key>`, `!context list`'
        );
    }
};
