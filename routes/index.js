// ./routes/index.js

'use strict';
const express = require('express');
const router = express.Router();

const userController = require('../controllers/UserController');
const categoryController = require('../controllers/CategoryController');
const subCategoryController = require('../controllers/SubCategoryController');
const incomeController = require('../controllers/IncomeController');
const spendingController = require('../controllers/SpendingController');
const backupController = require('../controllers/BackupController');
const uploadController = require('../controllers/UploadController');
const advisorController = require('../controllers/AdvisorController');
const usageController = require('../controllers/UsageController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


router.route('/users')
  .get(userController.getAllUsers)
  .post(userController.postUsers);

router.route('/categories')
  .get(categoryController.getAllCategories)
  .post(categoryController.postCategories);

router.route('/categories/:id')
  .put(categoryController.updateCategory);

router.route('/categories/delete/:id')
  .delete(categoryController.deleteCategory);

router.route('/subCategories/:id')
  .get(subCategoryController.getAllSubCategories)
  .post(subCategoryController.postSubCategories);

router.route('/subCategories/:id')
  .put(subCategoryController.updateSubCategory);

router.route('/subCategories/delete/:id')
  .delete(subCategoryController.deleteSubCategory);

router.route('/spendings')
  .post(spendingController.postSpendings)
  .get(spendingController.getAllSpendings);

router.route('/spendings/delete/:id')
  .post(spendingController.deleteSpendings);

router.route('/incomeSources')
  .get(incomeController.getIncomeSources)
  .post(incomeController.postIncomeSource);

router.route('/incomeSources/:id')
  .put(incomeController.updateIncomeSource);

router.route('/incomeSources/delete/:id')
  .delete(incomeController.deleteIncomeSource);

router.route('/incomes')
  .get(incomeController.getIncomes)
  .post(incomeController.postIncome);

router.route('/incomes/:id')
  .put(incomeController.updateIncome);

router.route('/incomes/delete/:id')
  .delete(incomeController.deleteIncome);

// Backup Routes
router.route('/backup')
  .get(backupController.getBackup);

router.route('/restore')
  .post(backupController.restoreBackup);

// Upload Route
router.post('/upload-receipt', upload.single('file'), uploadController.uploadReceipt);

router.get('/advisor/insight', advisorController.getInsight);

router.get('/usage', usageController.getUsageStats);

module.exports = router;