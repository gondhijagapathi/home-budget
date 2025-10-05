// ./routes/index.js

'use strict';
const express = require('express');
const router = express.Router(); // 👈 1. Create a Router instance
const controll = require('../controllers/HomeBudgetController');

// 2. Define routes using 'router.route' instead of 'app.route'

router.route('/users')
  .get(controll.getAllUsers)
  .post(controll.postUsers);

router.route('/categories')
  .get(controll.getAllCategories)
  .post(controll.postCategories);

router.route('/subCategories/:id')
  .get(controll.getAllSubCategories)
  .post(controll.postSubCategories);

router.route('/spendings')
  .post(controll.postSpendings)
  .get(controll.getAllSpendings);

router.route('/spendings/delete/:id')
  .post(controll.deleteSpendings);

// 3. Export the router object
module.exports = router;