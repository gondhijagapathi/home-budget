const db = require('../models/dbConnection');

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
        try {
            // Client sends { data: [spendingId, subCategoryId, userId, amount, dateOfSpending, categoryId] }
            const params = Array.isArray(req.body.data)
                ? req.body.data
                : [req.body.spendingId, req.body.subCategoryId, req.body.userId, req.body.amount, req.body.dateOfSpending, req.body.categoryId];

            // Validation
            if (!Array.isArray(params) || params.length !== 6) {
                return res.status(400).json({ error: 'Invalid data format. Expected array with 6 elements: [spendingId, subCategoryId, userId, amount, dateOfSpending, categoryId]' });
            }

            const [spendingId, subCategoryId, userId, amount, dateOfSpending, categoryId] = params;

            if (!spendingId || typeof spendingId !== 'string') {
                return res.status(400).json({ error: 'Spending ID is required' });
            }
            if (!subCategoryId || typeof subCategoryId !== 'string') {
                return res.status(400).json({ error: 'Subcategory ID is required' });
            }
            if (!userId || typeof userId !== 'string') {
                return res.status(400).json({ error: 'User ID is required' });
            }
            if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
                return res.status(400).json({ error: 'Amount must be a positive number' });
            }
            if (!dateOfSpending || typeof dateOfSpending !== 'string') {
                return res.status(400).json({ error: 'Date of spending is required' });
            }
            if (!categoryId || typeof categoryId !== 'string') {
                return res.status(400).json({ error: 'Category ID is required' });
            }

            // Validate date format (YYYY-MM-DD HH:mm:ss)
            const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
            if (!dateRegex.test(dateOfSpending)) {
                return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD HH:mm:ss' });
            }

            const results = await db(`INSERT INTO spendings (spendingId, subCategoryId, userId, amount, dateOfSpending, categoryId) VALUES (?, ?, ?, ?, ?, ?)`, params);
            res.status(201).json(results);
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Spending entry already exists' });
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ error: 'Invalid foreign key reference (subcategory, user, or category not found)' });
            }
            res.status(500).json({ error: 'Internal Server Error' });
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
