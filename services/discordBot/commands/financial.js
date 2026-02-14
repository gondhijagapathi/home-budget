const db = require('../../../models/dbConnection');
const { generateFinancialReport } = require('../financialAdvisor');

module.exports = {
    init: (registerCommand) => {
        registerCommand(
            'categories',
            async (message) => {
                try {
                    const categories = await db('SELECT * FROM category ORDER BY categoryName');
                    if (categories.length === 0) {
                        await message.reply('No categories found.');
                        return;
                    }

                    // Group subcategories
                    // This is a bit expensive if many categories, but ok for now. 
                    // Better: Join query.
                    const query = `
                        SELECT c.categoryName, sc.subCategoryName 
                        FROM category c 
                        LEFT JOIN subCategory sc ON c.categoryId = sc.categoryId
                        ORDER BY c.categoryName, sc.subCategoryName
                    `;
                    const rows = await db(query);

                    const catMap = {};
                    rows.forEach(row => {
                        if (!catMap[row.categoryName]) catMap[row.categoryName] = [];
                        if (row.subCategoryName) catMap[row.categoryName].push(row.subCategoryName);
                    });

                    let response = '**Categories:**\n';
                    for (const [cat, subs] of Object.entries(catMap)) {
                        response += `**${cat}**: ${subs.join(', ') || '(No subcategories)'}\n`;
                    }

                    // Split if too long
                    if (response.length > 2000) {
                        response = response.slice(0, 1900) + '... (truncated)';
                    }
                    await message.reply(response);
                } catch (err) {
                    console.error(err);
                    await message.reply('Error fetching categories.');
                }
            },
            'Lists all categories and subcategories.'
        );

        registerCommand(
            'budget',
            async (message, args) => {
                // Usage: !budget view [month] or !budget set [CategoryName] [Amount] [Month(optional)]

                if (args[0] === 'set') {
                    // Usage: !budget set <Category Name> <Amount> [YYYY-MM]
                    // Example: !budget set Dining Out 500 2023-12
                    // args: ['set', 'Dining', 'Out', '500', '2023-12']

                    const argsCopy = [...args];
                    argsCopy.shift(); // Remove 'set'

                    if (argsCopy.length < 2) {
                        await message.reply('Usage: `!budget set <Category Name> <Amount> [YYYY-MM]`');
                        return;
                    }

                    let targetMonth = null;
                    let amount = null;
                    let catNameParts = [];

                    // Check if last argument is a month
                    const lastArg = argsCopy[argsCopy.length - 1];
                    if (/^\d{4}-\d{2}$/.test(lastArg)) {
                        targetMonth = argsCopy.pop();
                    }

                    // Check if next last argument is the amount
                    const amountArg = argsCopy.pop();
                    if (isNaN(parseFloat(amountArg))) {
                        await message.reply('Invalid amount. Usage: `!budget set <Category Name> <Amount> [YYYY-MM]`');
                        return;
                    }
                    amount = parseFloat(amountArg);

                    // Remainder is category name
                    if (argsCopy.length === 0) {
                        await message.reply('Missing category name. Usage: `!budget set <Category Name> <Amount> [YYYY-MM]`');
                        return;
                    }
                    const catName = argsCopy.join(' ');

                    try {
                        // Find category ID
                        const catRes = await db('SELECT categoryId FROM category WHERE categoryName = ?', [catName]);
                        if (catRes.length === 0) {
                            await message.reply(`Category "${catName}" not found.`);
                            return;
                        }
                        const catId = catRes[0].categoryId;

                        // Check if budget exists for this category/month combo (month can be NULL)
                        let query, params;
                        if (targetMonth) {
                            query = 'SELECT budgetId FROM budget WHERE categoryId = ? AND month = ?';
                            params = [catId, targetMonth];
                        } else {
                            query = 'SELECT budgetId FROM budget WHERE categoryId = ? AND month IS NULL';
                            params = [catId];
                        }

                        const exist = await db(query, params);

                        if (exist.length > 0) {
                            await db('UPDATE budget SET amount = ? WHERE budgetId = ?', [amount, exist[0].budgetId]);
                            await message.reply(`Updated ${targetMonth ? `budget for **${targetMonth}**` : '**recurring default budget**'} for **${catName}** to ₹${amount}.`);
                        } else {
                            await db('INSERT INTO budget (categoryId, amount, month) VALUES (?, ?, ?)', [catId, amount, targetMonth]);
                            await message.reply(`Set ${targetMonth ? `budget for **${targetMonth}**` : '**recurring default budget**'} for **${catName}** to ₹${amount}.`);
                        }

                    } catch (err) {
                        console.error(err);
                        await message.reply('Error setting budget.');
                    }

                } else if (args[0] === 'delete') {
                    // Usage: !budget delete <Category Name> [YYYY-MM]
                    // Example: !budget delete Dining Out 2023-12

                    const argsCopy = [...args];
                    argsCopy.shift(); // Remove 'delete'

                    if (argsCopy.length < 1) {
                        await message.reply('Usage: `!budget delete <Category Name> [YYYY-MM]`');
                        return;
                    }

                    let targetMonth = null;

                    // Check if last argument is a month
                    const lastArg = argsCopy[argsCopy.length - 1];
                    if (/^\d{4}-\d{2}$/.test(lastArg)) {
                        targetMonth = argsCopy.pop();
                    }

                    // Remainder is category name
                    if (argsCopy.length === 0) {
                        await message.reply('Missing category name. Usage: `!budget delete <Category Name> [YYYY-MM]`');
                        return;
                    }
                    const catName = argsCopy.join(' ');

                    try {
                        // Find category ID
                        const catRes = await db('SELECT categoryId FROM category WHERE categoryName = ?', [catName]);
                        if (catRes.length === 0) {
                            await message.reply(`Category "${catName}" not found.`);
                            return;
                        }
                        const catId = catRes[0].categoryId;

                        // Delete
                        let query, params;
                        if (targetMonth) {
                            query = 'DELETE FROM budget WHERE categoryId = ? AND month = ?';
                            params = [catId, targetMonth];
                        } else {
                            query = 'DELETE FROM budget WHERE categoryId = ? AND month IS NULL';
                            params = [catId];
                        }

                        const result = await db(query, params);

                        if (result.affectedRows > 0) {
                            await message.reply(`Deleted ${targetMonth ? `budget for **${targetMonth}**` : '**recurring default budget**'} for **${catName}**.`);
                        } else {
                            await message.reply(`No ${targetMonth ? `budget found for **${targetMonth}**` : '**recurring default budget** found'} for **${catName}**.`);
                        }

                    } catch (err) {
                        console.error(err);
                        await message.reply('Error deleting budget.');
                    }

                } else {
                    // View
                    try {
                        let targetMonth = args[1]; // Optional month argument for view
                        if (!targetMonth) {
                            targetMonth = new Date().toISOString().slice(0, 7); // Default to current month
                        }

                        // Validate if user provided a month
                        if (args[1] && !/^\d{4}-\d{2}$/.test(args[1])) {
                            await message.reply('Invalid month format. Use YYYY-MM.');
                            return;
                        }

                        // Fetch both recurring defaults (NULL) and specific month budgets
                        const rows = await db(
                            `SELECT c.categoryName, b.amount, b.month 
                                 FROM budget b 
                                 JOIN category c ON b.categoryId = c.categoryId 
                                 WHERE b.month = ? OR b.month IS NULL`,
                            [targetMonth]
                        );

                        if (rows.length === 0) {
                            await message.reply(`No budgets set for ${targetMonth} (and no defaults found).`);
                            return;
                        }

                        // Merge logic: Specific month overrides default
                        const budgetMap = {};
                        rows.forEach(row => {
                            // If we already have an entry, check if the new one is more specific
                            // We prefer specific month (row.month !== null) over default (row.month === null)

                            if (!budgetMap[row.categoryName]) {
                                budgetMap[row.categoryName] = row;
                            } else {
                                // If current map entry is default, and new row is specific, overwrite
                                if (budgetMap[row.categoryName].month === null && row.month !== null) {
                                    budgetMap[row.categoryName] = row;
                                }
                            }
                        });


                        let response = `**Budgets for ${targetMonth}**\n`;
                        // Sort by category name
                        const sortedCats = Object.keys(budgetMap).sort();

                        sortedCats.forEach(cat => {
                            const data = budgetMap[cat];
                            const isDefault = data.month === null;
                            response += `**${cat}**: ₹${data.amount}${isDefault ? ' (Default)' : ''}\n`;
                        });

                        await message.reply(response);

                    } catch (err) {
                        console.error(err);
                        await message.reply('Error retrieving budgets.');
                    }
                }
            },
            'Set or view monthly budgets. Usage: `!budget set <Category> <Amount> [Month]` or `!budget view [Month]`'
        );

        registerCommand(
            'report',
            async (message) => {
                await message.reply('Generating financial report... this may take a few seconds.');
                try {
                    // We can reuse the generateFinancialReport function
                    // Note: The function in financialAdvisor.js fetches data and uses Gemini
                    // It returns a String.
                    // However, we need to make sure we don't duplicate the "Weekly Assessment" logic which sends it automatically? 
                    // No, generateFinancialReport just returns text, it doesn't send.

                    // Generate report for the current cycle (default behavior if no args passed)
                    const report = await generateFinancialReport();

                    // Send it
                    if (report) {
                        // The sendMessage function in bot.js handles splitting. 
                        // But here we are replying to a message. 
                        // We can just use message.channel.send(report) or use the helper. 
                        // Helper is better.

                        // Wait, generateFinancialReport returns the text.
                        // We can just reply.

                        const helper = require('../bot'); // Circular dependency risk? 
                        // bot.js requires financialAdvisor? No. scheduler requires bot and financialAdvisor.
                        // financialAdvisor requires db.
                        // commands/financial requires financialAdvisor.
                        // bot requires commandHandler -> commands -> financialAdvisor.
                        // It seems ok.

                        // Actually, let's just use message.reply if size allows, or split it.
                        // Reusing the split logic from bot.js would be ideal but bot.js exports `sendMessage` which uses a fixed channel ID.
                        // We want to reply in the current channel (Management Channel).

                        // Simple split logic:
                        if (report.length > 2000) {
                            const chunks = report.match(/[\s\S]{1,2000}/g) || [];
                            for (const chunk of chunks) {
                                await message.channel.send(chunk);
                            }
                        } else {
                            await message.channel.send(report);
                        }

                    } else {
                        await message.reply('Failed to generate report.');
                    }

                } catch (err) {
                    console.error(err);
                    await message.reply('Error generating report.');
                }
            },
            'Manually triggers the AI financial report.'
        );
    }
};
