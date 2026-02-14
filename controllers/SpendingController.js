const db = require('../models/dbConnection');
const uuid = require('react-uuid');
const { checkBudget } = require('../services/discordBot/utils/budgetAlert');
const { sendMessage } = require('../services/discordBot/bot');

const SpendingController = {
    getAllSpendings: async function (req, res) {
        try {
            const { startDate, endDate } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const offset = (page - 1) * limit;

            let query = `
                SELECT
                    spendings.*,
                    subCategory.subCategoryName,
                    category.categoryName,
                    users.userName
                FROM
                    spendings
                LEFT JOIN
                    subCategory ON spendings.subCategoryId = subCategory.subCategoryId
                LEFT JOIN
                    category ON spendings.categoryId = category.categoryId
                LEFT JOIN
                    users ON spendings.userId = users.personId
            `;

            const queryParams = [];
            const whereClauses = [];

            if (startDate && endDate) {
                whereClauses.push('spendings.dateOfSpending BETWEEN ? AND ?');
                queryParams.push(startDate, endDate);
            }

            if (whereClauses.length > 0) {
                query += ' WHERE ' + whereClauses.join(' AND ');
            }

            // Get total count for pagination
            const countQuery = `SELECT COUNT(*) as count FROM spendings ${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''}`;
            // We use a fresh params array for count (since count doesn't need LIMIT/OFFSET params)
            // But here we can reuse queryParams since we haven't pushed limit/offset yet!
            const countResult = await db(countQuery, queryParams);
            const total = countResult[0].count;

            const allowedSortColumns = ['dateOfSpending', 'amount'];
            const sortBy = allowedSortColumns.includes(req.query.sortBy) ? req.query.sortBy : 'dateOfSpending';
            const order = req.query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            query += ` ORDER BY spendings.${sortBy} ${order} LIMIT ? OFFSET ?`;
            queryParams.push(limit, offset);

            const results = await db(query, queryParams);

            res.json({
                data: results,
                total: total,
                page: page,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    postSpendings: async function (req, res) {
        const { categoryId, subCategoryId, userId, amount, dateOfSpending } = req.body;

        if (!categoryId || !amount) {
            return res.status(400).json({ message: 'Category and Amount are required' });
        }

        // Assuming uuid() is imported or defined elsewhere for generating unique IDs
        // Assuming checkBudget and sendMessage are imported or defined elsewhere
        const newSpending = {
            spendingId: uuid(),
            categoryId,
            subCategoryId: subCategoryId || null,
            userId: userId || 'default_user',
            amount: parseFloat(amount),
            dateOfSpending: dateOfSpending ? new Date(dateOfSpending) : new Date()
        };

        try {
            await db('INSERT INTO spendings SET ?', newSpending);
            res.status(201).json(newSpending);

            // --- Discord Budget Check ---
            checkBudget(newSpending.categoryId, newSpending.amount, newSpending.dateOfSpending)
                .then(alertMsg => {
                    if (alertMsg) {
                        console.log('[BudgetAlert] Sending alert:', alertMsg);
                        sendMessage(alertMsg);
                    }
                })
                .catch(err => console.error('[BudgetAlert] Failed:', err));
            // ----------------------------

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to save spending' });
        }
    },

    deleteSpendings: async function (req, res) {
        try {
            const id = req.params.id;

            // Validation
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Spending ID is required' });
            }

            const query = 'DELETE from spendings where spendingId = ?';
            const results = await db(query, [id]);

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Spending not found' });
            }

            res.json({ message: 'Spending deleted successfully', affectedRows: results.affectedRows });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

module.exports = SpendingController;
