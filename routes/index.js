// ./routes/index.js

'use strict';
const express = require('express');
const router = express.Router(); // 👈 1. Create a Router instance
const controller = require('../controllers/HomeBudgetController');

router.route('/users')
  .get(controller.getAllUsers)
  .post(controller.postUsers);

router.route('/categories')
  .get(controller.getAllCategories)
  .post(controller.postCategories);

router.route('/categories/:id') // New PUT route for categories
  .put(controller.updateCategory);

router.route('/categories/delete/:id') // New DELETE route for categories
  .delete(controller.deleteCategory);

router.route('/subCategories/:id')
  .get(controller.getAllSubCategories)
  .post(controller.postSubCategories);

router.route('/subCategories/:id') // New PUT route for subcategories
  .put(controller.updateSubCategory);

router.route('/subCategories/delete/:id') // New DELETE route for subcategories
  .delete(controller.deleteSubCategory);

router.route('/spendings')
  .post(controller.postSpendings)
  .get(controller.getAllSpendings);

router.route('/spendings/delete/:id')
  .post(controller.deleteSpendings);

// 3. Export the router object
module.exports = router;