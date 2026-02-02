//include the model (aka DB connection)
const db = require('../models/dbConnection');

//create class
var HomeBudgetController = {

    //function to query all items
    getAllSpendings: async function (req, res) {
        try {
            const { startDate, endDate } = req.query;
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

            if (startDate && endDate) {
                query += ` WHERE spendings.dateOfSpending BETWEEN ? AND ?`;
                queryParams.push(startDate, endDate);
            }
            query += ` ORDER BY spendings.dateOfSpending DESC`;
            
            const results = await db(query, queryParams);
            res.json(results);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    //function to query all items
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
    },

    //function to query all items
    getAllUsers: async function (req, res) {
        try {
            const results = await db('SELECT * from users');
            res.json(results);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    getAllCategories: async function (req, res) {
        try {
            const results = await db('SELECT * from category ORDER BY categoryName');
            res.json(results);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    getAllSubCategories: async function (req, res) {
        try {
            let id = req.params.id;
            let query = 'SELECT * from subCategory ORDER BY subCategoryName';

            if (id != "0") {
                query = 'SELECT * from subCategory WHERE categoryId = ? ORDER BY subCategoryName';
            }
            const results = await db(query, [id]);
            res.json(results);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    postCategories: async function (req, res) {
        try {
            const { categoryName } = req.body;
            
            // Validation
            if (!categoryName || typeof categoryName !== 'string' || categoryName.trim().length === 0) {
                return res.status(400).json({ error: 'Category name is required and must be a non-empty string' });
            }
            if (categoryName.length > 255) {
                return res.status(400).json({ error: 'Category name must be 255 characters or less' });
            }
            
            const results = await db(`INSERT INTO category (categoryName) VALUES (?)`,
                [categoryName.trim()]);
            res.status(201).json(results);
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Category already exists' });
            }
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
    },
    postSubCategories: async function (req, res) {
        try {
            const { subCategoryName, categoryId } = req.body;
            
            // Validation
            if (!subCategoryName || typeof subCategoryName !== 'string' || subCategoryName.trim().length === 0) {
                return res.status(400).json({ error: 'Subcategory name is required and must be a non-empty string' });
            }
            if (subCategoryName.length > 255) {
                return res.status(400).json({ error: 'Subcategory name must be 255 characters or less' });
            }
            if (!categoryId || typeof categoryId !== 'string') {
                return res.status(400).json({ error: 'Category ID is required' });
            }
            
            const results = await db(`INSERT INTO subCategory (subCategoryName, categoryId) VALUES (?, ?)`,
                [subCategoryName.trim(), categoryId]);
            res.status(201).json(results);
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Subcategory already exists' });
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ error: 'Invalid category ID' });
            }
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
};
module.exports = HomeBudgetController;
