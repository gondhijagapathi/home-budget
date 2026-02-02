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

router.route('/subCategories/:id')
  .get(controller.getAllSubCategories)
  .post(controller.postSubCategories);

router.route('/spendings')
  .post(controller.postSpendings)
  .get(controller.getAllSpendings);

router.route('/spendings/delete/:id')
  .post(controller.deleteSpendings);

// 3. Export the router object
module.exports = router;