//include the model (aka DB connection)
var db = require('../models/dbConnection'); 

//create class
var HomeBudgetController = {

//function to query all items
getAllSpendings: function (req, res) {
    const query = 'SELECT * from spendings LEFT JOIN subCategory on spendings.subCategoryId = subCategory.subCategoryId ORDER BY spendings.dateOfSpending DESC LIMIT 10';
    db.query(query, (error, results) => {
      handleResponse(res, error, results);
    });
},

//function to query all items
deleteSpendings: function (req, res) {
    const { id } = req.params;
    const query = 'DELETE from spendings where spendingId = ?';
    db.query(query, [id], (error, results) => {
      handleResponse(res, error, results);
    });
},

//function to query all items
getAllUsers: function (req, res) {
    const query = 'SELECT * from users';
    db.query(query, (error, results) => {
      handleResponse(res, error, results);
    });
},

getAllCategories: function (req, res) {
    const query = 'SELECT * from category ORDER BY categoryName';
    db.query(query, (error, results) => {
      handleResponse(res, error, results);
    });
},
getAllSubCategories: function (req, res) {
    const { id } = req.params;
    let query = 'SELECT * from subCategory ORDER BY subCategoryName';
    let params = [];
    if (id !== '0') {
      query = 'SELECT * from subCategory WHERE categoryId = ? ORDER BY subCategoryName';
      params.push(id);
    }
    db.query(query, params, (error, results) => {
      handleResponse(res, error, results);
    });
},
const { v4: uuidv4 } = require('uuid');

postCategories: function (req, res) {
    const { categoryName } = req.body;
    const categoryId = uuidv4();
    const query = 'INSERT INTO category (categoryId, categoryName) VALUES (?, ?)';
    db.query(query, [categoryId, categoryName], (error, results) => {
      handleResponse(res, error, results);
    });
},
postUsers: function (req, res) {
    const { userName } = req.body;
    const userId = uuidv4();
    const query = 'INSERT INTO users (userId, userName, creationDate) VALUES (?, ?, ?)';
    db.query(query, [userId, userName, new Date()], (error, results) => {
      handleResponse(res, error, results);
    });
},
postSubCategories: function (req, res) {
    const { subCategoryName, categoryId } = req.body;
    const subCategoryId = uuidv4();
    const query = 'INSERT INTO subCategory (subCategoryId, subCategoryName, categoryId) VALUES (?, ?, ?)';
    db.query(query, [subCategoryId, subCategoryName, categoryId], (error, results) => {
      handleResponse(res, error, results);
    });
},
const handleResponse = (res, error, results) => {
  if (error) {
    res.status(500).json({ error: error });
  } else {
    res.json(results);
  }
};

postSpendings: function (req, res) {
    const { data } = req.body;
    const query = 'INSERT INTO spendings (spendingId, dateOfSpending, spendingName, subCategoryId, userId, amount) VALUES ?';
    db.query(query, [data.map(item => [item.spendingId, item.dateOfSpending, item.spendingName, item.subCategoryId, item.userId, item.amount])], (error, results) => {
      handleResponse(res, error, results);
    });
},
};
module.exports = Strain;
