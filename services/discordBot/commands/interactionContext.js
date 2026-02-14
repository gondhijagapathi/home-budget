const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags,
    EmbedBuilder
} = require('discord.js');
const db = require('../../../models/dbConnection');

module.exports = {
    // 1. Definition
    slashBuilder: new SlashCommandBuilder()
        .setName('manage_context')
        .setDescription('Manage context and goals for the financial advisor AI'),

    // 2. Execution (Initial Command)
    executeInteraction: async (interaction) => {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Fetch current context
            const contextRows = await db('SELECT contextId, contextKey, content FROM advisor_context');

            let description = "Here is the current context the AI uses to generate your reports:\n\n";
            if (contextRows.length === 0) {
                description += "*No context set (e.g., 'Saving for House', 'Paying off Loan').*";
            } else {
                contextRows.forEach(row => {
                    description += `**${row.contextKey}**: ${row.content}\n`;
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('🧠 AI Advisor Context')
                .setDescription(description)
                .setColor(0x00AE86);

            // Buttons: Add, Delete
            const addBtn = new ButtonBuilder()
                .setCustomId('manage_context_add_btn')
                .setLabel('Add Context')
                .setStyle(ButtonStyle.Success)
                .setEmoji('➕');

            const deleteBtn = new ButtonBuilder()
                .setCustomId('manage_context_delete_mode_btn')
                .setLabel('Delete Context')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️')
                .setDisabled(contextRows.length === 0);

            const row = new ActionRowBuilder().addComponents(addBtn, deleteBtn);

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('[Context] Error:', error);
            if (interaction.deferred) {
                await interaction.editReply({ content: 'Internal error loading context.' });
            } else {
                await interaction.reply({ content: 'Internal error.', flags: MessageFlags.Ephemeral });
            }
        }
    },

    // 3. Component Handler
    handleComponent: async (interaction) => {
        const customId = interaction.customId;

        // A. OPEN ADD MODAL
        if (customId === 'manage_context_add_btn') {
            const modal = new ModalBuilder()
                .setCustomId('manage_context_add_modal')
                .setTitle('Add AI Context');

            const keyInput = new TextInputBuilder()
                .setCustomId('contextKey')
                .setLabel("Topic (Short Key)")
                .setPlaceholder("e.g., 'Goal', 'Loan', 'Family'")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const contentInput = new TextInputBuilder()
                .setCustomId('contextContent')
                .setLabel("Details")
                .setPlaceholder("e.g., 'I want to save 50k for a bike by Dec.'")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const row1 = new ActionRowBuilder().addComponents(keyInput);
            const row2 = new ActionRowBuilder().addComponents(contentInput);

            modal.addComponents(row1, row2);
            await interaction.showModal(modal);
        }

        // B. SWITCH TO DELETE MODE (Show Dropdown)
        else if (customId === 'manage_context_delete_mode_btn') {
            await interaction.deferUpdate(); // Acknowledge button click

            const contextRows = await db('SELECT contextId, contextKey FROM advisor_context');
            if (contextRows.length === 0) {
                await interaction.editReply({ content: 'No items to delete.', components: [] });
                return;
            }

            const select = new StringSelectMenuBuilder()
                .setCustomId('manage_context_delete_select')
                .setPlaceholder('Select item to remove')
                .addOptions(
                    contextRows.map(row =>
                        new StringSelectMenuOptionBuilder()
                            .setLabel(row.contextKey)
                            .setValue(String(row.contextId))
                    )
                );

            const row = new ActionRowBuilder().addComponents(select);

            // Allow going back? Maybe just a "Cancel" button, but for now simple is fine.
            await interaction.editReply({ content: 'Select an item to delete:', embeds: [], components: [row] });
        }

        // C. HANDLE DELETE SELECTION
        else if (customId === 'manage_context_delete_select') {
            await interaction.deferUpdate();
            const contextId = interaction.values[0];

            try {
                await db('DELETE FROM advisor_context WHERE contextId = ?', [contextId]);
                // Refresh the main view
                // Can we call executeInteraction? No, it takes different args usually.
                // Let's just update the message to say deleted and show a "Back" button, or just list again.

                await interaction.editReply({ content: '✅ Item deleted. Run `/manage_context` to see updated list.', components: [], embeds: [] });
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: 'Failed to delete item.' });
            }
        }

        // D. HANDEL ADD MODAL SUBMIT
        else if (customId === 'manage_context_add_modal') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const key = interaction.fields.getTextInputValue('contextKey');
            const content = interaction.fields.getTextInputValue('contextContent');

            try {
                // Upsert based on key? Or just Insert? Key is UNIQUE in schema.
                // Insert ON DUPLICATE UPDATE
                await db(
                    `INSERT INTO advisor_context (contextKey, content) VALUES (?, ?) 
                     ON DUPLICATE KEY UPDATE content = VALUES(content)`,
                    [key, content]
                );

                await interaction.editReply({ content: `✅ Saved context: **${key}**` });
            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: 'Database error. Key might be too long or invalid.' });
            }
        }
    }
};
