const db = require('../models/dbConnection');

const IncomeController = {
    // --- Income Sources ---

    getIncomeSources: async function (req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const offset = (page - 1) * limit;

            const countResult = await db('SELECT COUNT(*) as count FROM incomeSource');
            const total = countResult[0].count;

            const results = await db('SELECT * FROM incomeSource ORDER BY sourceName LIMIT ? OFFSET ?', [limit, offset]);

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

    postIncomeSource: async function (req, res) {
        try {
            const { sourceName } = req.body;
            if (!sourceName || typeof sourceName !== 'string' || sourceName.trim().length === 0) {
                return res.status(400).json({ error: 'Source name is required' });
            }
            if (sourceName.length > 200) {
                return res.status(400).json({ error: 'Source name too long' });
            }

            const results = await db('INSERT INTO incomeSource (sourceName) VALUES (?)', [sourceName.trim()]);
            res.status(201).json(results);
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Income source already exists' });
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    updateIncomeSource: async function (req, res) {
        try {
            const id = req.params.id;
            const { sourceName } = req.body;

            if (!id) return res.status(400).json({ error: 'ID required' });
            if (!sourceName || typeof sourceName !== 'string' || sourceName.trim().length === 0) {
                return res.status(400).json({ error: 'Source name is required' });
            }

            const results = await db('UPDATE incomeSource SET sourceName = ? WHERE incomeSourceId = ?', [sourceName.trim(), id]);
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Income source not found' });
            }
            res.json({ message: 'Updated successfully' });
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Income source already exists' });
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    deleteIncomeSource: async function (req, res) {
        try {
            const id = req.params.id;
            if (!id) return res.status(400).json({ error: 'ID required' });

            const results = await db('DELETE FROM incomeSource WHERE incomeSourceId = ?', [id]);
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Income source not found' });
            }
            res.json({ message: 'Deleted successfully' });
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ error: 'Cannot delete source with associated incomes' });
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // --- Incomes ---

    getIncomes: async function (req, res) {
        try {
            const { startDate, endDate } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    income.*, 
                    incomeSource.sourceName,
                    users.userName
                FROM income
                LEFT JOIN incomeSource ON income.incomeSourceId = incomeSource.incomeSourceId
                LEFT JOIN users ON income.userId = users.personId
            `;

            const queryParams = [];
            const whereClauses = [];

            if (startDate && endDate) {
                whereClauses.push('income.dateOfIncome BETWEEN ? AND ?');
                queryParams.push(startDate, endDate);
            }

            if (whereClauses.length > 0) {
                query += ' WHERE ' + whereClauses.join(' AND ');
            }

            // Get total count for pagination
            const countQuery = `SELECT COUNT(*) as count FROM income ${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''}`;
            const countResult = await db(countQuery, queryParams);
            const total = countResult[0].count;

            query += ` ORDER BY income.dateOfIncome DESC LIMIT ? OFFSET ?`;
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

    postIncome: async function (req, res) {
        try {
            // Expecting body: { incomeSourceId, userId, amount, dateOfIncome, description }
            // Or { data: [...] } for bulk but sticking to object for now based on other controllers being a bit mixed
            // Re-using SpendingController pattern if possible, but let's stick to clean object body

            const { incomeSourceId, userId, amount, dateOfIncome, description } = req.body;

            if (!incomeSourceId || !userId || !amount || !dateOfIncome) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const results = await db(
                'INSERT INTO income (incomeSourceId, userId, amount, dateOfIncome, description) VALUES (?, ?, ?, ?, ?)',
                [incomeSourceId, userId, amount, dateOfIncome, description || '']
            );
            res.status(201).json(results);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    updateIncome: async function (req, res) {
        try {
            const id = req.params.id;
            const { incomeSourceId, userId, amount, dateOfIncome, description } = req.body;

            if (!id) return res.status(400).json({ error: 'ID required' });

            const results = await db(
                'UPDATE income SET incomeSourceId=?, userId=?, amount=?, dateOfIncome=?, description=? WHERE incomeId=?',
                [incomeSourceId, userId, amount, dateOfIncome, description || '', id]
            );

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Income entry not found' });
            }
            res.json({ message: 'Updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    deleteIncome: async function (req, res) {
        try {
            const id = req.params.id;
            if (!id) return res.status(400).json({ error: 'ID required' });

            const results = await db('DELETE FROM income WHERE incomeId = ?', [id]);
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Income entry not found' });
            }
            res.json({ message: 'Deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

module.exports = IncomeController;
