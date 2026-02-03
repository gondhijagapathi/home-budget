const db = require('../models/dbConnection');

const UserController = {
    getAllUsers: async function (req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const offset = (page - 1) * limit;

            const countResult = await db('SELECT COUNT(*) as count FROM users');
            const total = countResult[0].count;

            const results = await db('SELECT * from users LIMIT ? OFFSET ?', [limit, offset]);

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

    postUsers: async function (req, res) {
        try {
            const { userName } = req.body;

            // Validation
            if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
                return res.status(400).json({ error: 'User name is required and must be a non-empty string' });
            }
            if (userName.length > 255) {
                return res.status(400).json({ error: 'User name must be 255 characters or less' });
            }

            const results = await db(`INSERT INTO users (userName, createdAt) VALUES (?, ?)`,
                [userName.trim(), new Date()]);
            res.status(201).json(results);
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'User already exists' });
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

module.exports = UserController;
