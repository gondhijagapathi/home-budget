const db = require('../models/dbConnection');

const CategoryController = {
    getAllCategories: async function (req, res) {
        try {
            const results = await db('SELECT * from category ORDER BY categoryName');
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

    updateCategory: async function (req, res) {
        try {
            const id = req.params.id;
            const { categoryName } = req.body;

            // Validation
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Category ID is required' });
            }
            if (!categoryName || typeof categoryName !== 'string' || categoryName.trim().length === 0) {
                return res.status(400).json({ error: 'Category name is required and must be a non-empty string' });
            }
            if (categoryName.length > 255) {
                return res.status(400).json({ error: 'Category name must be 255 characters or less' });
            }

            const query = 'UPDATE category SET categoryName = ? WHERE categoryId = ?';
            const results = await db(query, [categoryName.trim(), id]);

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Category not found or no changes made' });
            }

            res.json({ message: 'Category updated successfully', affectedRows: results.affectedRows });
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Category name already exists' });
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    deleteCategory: async function (req, res) {
        try {
            const id = req.params.id;

            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Category ID is required' });
            }

            const query = 'DELETE from category where categoryId = ?';
            const results = await db(query, [id]);

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Category not found' });
            }

            res.json({ message: 'Category deleted successfully', affectedRows: results.affectedRows });
        } catch (error) {
            console.error(error);
            // Handle foreign key constraint error if subcategories exist
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ error: 'Cannot delete category because it has associated subcategories. Please delete subcategories first.' });
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

module.exports = CategoryController;
