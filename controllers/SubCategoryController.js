const db = require('../models/dbConnection');

const SubCategoryController = {
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

    updateSubCategory: async function (req, res) {
        try {
            const id = req.params.id;
            const { subCategoryName, categoryId } = req.body;

            // Validation
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Subcategory ID is required' });
            }
            if (!subCategoryName || typeof subCategoryName !== 'string' || subCategoryName.trim().length === 0) {
                return res.status(400).json({ error: 'Subcategory name is required and must be a non-empty string' });
            }
            if (subCategoryName.length > 255) {
                return res.status(400).json({ error: 'Subcategory name must be 255 characters or less' });
            }
            if (!categoryId || typeof categoryId !== 'string') {
                return res.status(400).json({ error: 'Category ID is required for subcategory update' });
            }

            const query = 'UPDATE subCategory SET subCategoryName = ?, categoryId = ? WHERE subCategoryId = ?';
            const results = await db(query, [subCategoryName.trim(), categoryId, id]);

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Subcategory not found or no changes made' });
            }

            res.json({ message: 'Subcategory updated successfully', affectedRows: results.affectedRows });
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Subcategory name already exists under this category' });
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ error: 'Invalid category ID provided for subcategory' });
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    deleteSubCategory: async function (req, res) {
        try {
            const id = req.params.id;

            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Subcategory ID is required' });
            }

            const query = 'DELETE from subCategory where subCategoryId = ?';
            const results = await db(query, [id]);

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Subcategory not found' });
            }

            res.json({ message: 'Subcategory deleted successfully', affectedRows: results.affectedRows });
        } catch (error) {
            console.error(error);
            // Handle foreign key constraint error if spendings exist for this subcategory
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ error: 'Cannot delete subcategory because it has associated spendings. Please delete spendings first.' });
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

module.exports = SubCategoryController;
