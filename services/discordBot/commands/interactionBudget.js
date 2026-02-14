const {
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags
} = require('discord.js');
const db = require('../../../models/dbConnection');

module.exports = {
    // 1. Definition for Registration
    slashBuilder: new SlashCommandBuilder()
        .setName('manage_budget')
        .setDescription('Interactive budget management'),

    init: (registerCommand) => {
        // We can still register a legacy text command if we want, but this is mainly for slash
        // registerCommand('manage_budget', async (msg) => { await msg.reply('Please use /manage_budget'); }, 'Use slash command.');
        // Actually, let's not clutter the help menu if it's slash-only.
    },

    // 2. Execution Handler (Slash Command)
    executeInteraction: async (interaction) => {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Fetch categories
            const categories = await db('SELECT categoryId, categoryName FROM category ORDER BY categoryName');

            if (categories.length === 0) {
                await interaction.editReply({ content: 'No categories found in database.' });
                return;
            }

            // Create Dropdown
            const select = new StringSelectMenuBuilder()
                .setCustomId('manage_budget_select_category')
                .setPlaceholder('Select a category to manage')
                .addOptions(
                    categories.map(cat =>
                        new StringSelectMenuOptionBuilder()
                            .setLabel(cat.categoryName)
                            .setValue(cat.categoryId)
                        //.setDescription(`ID: ${cat.categoryId}`)
                    )
                );

            const row = new ActionRowBuilder().addComponents(select);

            await interaction.editReply({
                content: 'Choose a category to view or edit its budget:',
                components: [row]
            });

        } catch (error) {
            console.error('Error in manage_budget:', error);
            // If already deferred, use editReply. If not, use reply.
            if (interaction.deferred) {
                await interaction.editReply({ content: 'Internal error.' });
            } else {
                await interaction.reply({ content: 'Internal error.', flags: MessageFlags.Ephemeral });
            }
        }
    },

    // 3. Component Handler (Dropdowns, Buttons, Modals)
    handleComponent: async (interaction) => {
        const customId = interaction.customId;
        console.log('[BudgetInteract] Handling component:', customId);

        // A. CATEGORY SELECTION
        if (customId === 'manage_budget_select_category') {
            const categoryId = interaction.values[0];

            // Defer update because DB might be slow
            await interaction.deferUpdate();

            try {
                // Fetch Category Name
                const catRes = await db('SELECT categoryName FROM category WHERE categoryId = ?', [categoryId]);
                const categoryName = catRes[0]?.categoryName || 'Unknown';

                // Fetch Current Budget (Default & Current Month)
                const now = new Date();
                const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                const budgets = await db('SELECT amount, month FROM budget WHERE categoryId = ? AND (month IS NULL OR month = ?)', [categoryId, monthStr]);

                let defaultBudget = budgets.find(b => b.month === null)?.amount || 0;
                let monthBudget = budgets.find(b => b.month === monthStr)?.amount || 0;

                // Construct Display
                let content = `**Category: ${categoryName}**\n`;
                content += `Recurring Default Budget: ₹${defaultBudget}\n`;
                content += `This Month (${monthStr}): ${monthBudget ? '₹' + monthBudget : 'Uses Default (₹' + defaultBudget + ')'}\n`;

                // Buttons
                const setBtn = new ButtonBuilder()
                    .setCustomId(`manage_budget_set_${categoryId}`)
                    .setLabel('Set Budget')
                    .setStyle(ButtonStyle.Primary);

                const deleteBtn = new ButtonBuilder()
                    .setCustomId(`manage_budget_delete_${categoryId}`)
                    .setLabel('Clear Budget')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder().addComponents(setBtn, deleteBtn);

                await interaction.editReply({
                    content: content,
                    components: [row]
                });

            } catch (error) {
                console.error('Error selecting category:', error);
                await interaction.editReply({ content: 'Database error.' }); // Already deferred
            }
        }

        // B. SET BUDGET BUTTON -> OPEN MODAL
        else if (customId.startsWith('manage_budget_set_')) {
            const categoryId = customId.replace('manage_budget_set_', '');

            const modal = new ModalBuilder()
                .setCustomId(`manage_budget_modal_${categoryId}`)
                .setTitle('Set Budget');

            const amountInput = new TextInputBuilder()
                .setCustomId('amountInput')
                .setLabel("Amount (₹)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setPlaceholder('5000');

            const typeInput = new TextInputBuilder()
                .setCustomId('typeInput')
                .setLabel("Type (Default or Month)")
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setPlaceholder('Leave empty for Default (Recurring)');

            const firstActionRow = new ActionRowBuilder().addComponents(amountInput);
            const secondActionRow = new ActionRowBuilder().addComponents(typeInput);

            modal.addComponents(firstActionRow, secondActionRow);

            await interaction.showModal(modal);
        }

        // C. DELETE BUDGET BUTTON
        else if (customId.startsWith('manage_budget_delete_')) {
            const categoryId = customId.replace('manage_budget_delete_', '');
            try {
                await interaction.deferUpdate();
                await db('DELETE FROM budget WHERE categoryId = ?', [categoryId]);
                await interaction.editReply({ content: `✅ Budget cleared for category.`, components: [] });
            } catch (e) {
                console.error(e);
                if (interaction.deferred) {
                    await interaction.editReply({ content: 'Failed to delete.' });
                } else {
                    await interaction.reply({ content: 'Failed to delete.', flags: MessageFlags.Ephemeral });
                }
            }
        }

        // D. MODAL SUBMIT
        else if (customId.startsWith('manage_budget_modal_')) {
            const categoryId = customId.replace('manage_budget_modal_', '');
            const amount = interaction.fields.getTextInputValue('amountInput');
            const type = interaction.fields.getTextInputValue('typeInput');

            if (isNaN(parseFloat(amount))) {
                await interaction.reply({ content: 'Invalid amount.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Defer because DB insert/update might take time
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const targetMonth = type && type.toLowerCase().includes('month')
                ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` // Simple Check
                : null; // Null means default

            try {
                // Check if exists
                let query = `SELECT budgetId FROM budget WHERE categoryId = ? AND month ${targetMonth ? '= ?' : 'IS NULL'}`;
                let params = targetMonth ? [categoryId, targetMonth] : [categoryId];
                const existing = await db(query, params);

                if (existing.length > 0) {
                    await db(`UPDATE budget SET amount = ? WHERE budgetId = ?`, [amount, existing[0].budgetId]);
                } else {
                    await db(`INSERT INTO budget (categoryId, amount, month) VALUES (?, ?, ?)`, [categoryId, amount, targetMonth]);
                }

                await interaction.editReply({ content: `✅ Budget updated to ₹${amount} (${targetMonth || 'Recurring'}).` });

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: 'Database error saving budget.' });
            }
        }
    }
};
