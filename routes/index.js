// ./routes/index.js

'use strict';
const express = require('express');
const router = express.Router();

const userController = require('../controllers/UserController');
const categoryController = require('../controllers/CategoryController');
const subCategoryController = require('../controllers/SubCategoryController');
const spendingController = require('../controllers/SpendingController');

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

module.exports = router;