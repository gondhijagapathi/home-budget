//include the model (aka DB connection)
var db = require('../models/dbConnection'); 

//create class
var Strain = {

//function to query all items
getAllSpendings: function (req, res) {

    var results = db.query('SELECT * from spendings LEFT JOIN subCategory on spendings.subCategoryId = subCategory.subCategoryId ORDER BY spendings.dateOfSpending DESC LIMIT 10', function (error, results, fields) {
        //if error, print blank results
        if (error) {
            var apiResult = {};
            apiResult= [];
            res.json(apiResult);
        }
        
        //make results 
        var resultJson = JSON.stringify(results);
        resultJson = JSON.parse(resultJson);
        var apiResult = {};
        
        //add our JSON results to the data table
        apiResult = resultJson;
        
        //send JSON to Express
        res.json(apiResult);
    });
},

//function to query all items
deleteSpendings: function (req, res) {
    let id = req.params.id;
    let query = 'DELETE from spendings where spendingId = ?';

    var results = db.query(query, 
    [id] 
    ,function (error, results, fields) {
        //if error, print blank results
        if (error) {
            var apiResult = {};
            apiResult= {'error':error};
            res.status(500);
            res.json(apiResult);
        }
        
        //make results 
        var resultJson = JSON.stringify(results);
        resultJson = JSON.parse(resultJson);
        var apiResult = {};
        
        //add our JSON results to the data table
        apiResult = resultJson;
        
        //send JSON to Express
        res.json(apiResult);
    });
},

//function to query all items
getAllUsers: function (req, res) {

    var results = db.query('SELECT * from users', function (error, results, fields) {
        //if error, print blank results
        if (error) {
            var apiResult = {};
            apiResult= [];
            res.json(apiResult);
        }
        
        //make results 
        var resultJson = JSON.stringify(results);
        resultJson = JSON.parse(resultJson);
        var apiResult = {};
        
        //add our JSON results to the data table
        apiResult = resultJson;
        
        //send JSON to Express
        res.json(apiResult);
    });
},

getAllCategories: function (req, res) {

    var results = db.query('SELECT * from category ORDER BY categoryName', function (error, results, fields) {
        //if error, print blank results
        if (error) {
            var apiResult = {};
            apiResult= [];
            res.json(apiResult);
        }
        
        //make results 
        var resultJson = JSON.stringify(results);
        resultJson = JSON.parse(resultJson);
        var apiResult = {};
        
        //add our JSON results to the data table
        apiResult = resultJson;
        
        //send JSON to Express
        res.json(apiResult);
    });
},
getAllSubCategories: function (req, res) {
    let id = req.params.id;
    let query = 'SELECT * from subCategory ORDER BY subCategoryName';

    if(id != "0")
    {
        query='SELECT * from subCategory WHERE categoryId = ? ORDER BY subCategoryName';
    }
    var results = db.query(query, 
    [id] 
    ,function (error, results, fields) {
        //if error, print blank results
        if (error) {
            var apiResult = {};
            apiResult= [];
            res.json(apiResult);
        }
        
        //make results 
        var resultJson = JSON.stringify(results);
        resultJson = JSON.parse(resultJson);
        var apiResult = {};
        
        //add our JSON results to the data table
        apiResult = resultJson;
        
        //send JSON to Express
        res.json(apiResult);
    });
},
postCategories: function (req, res) {

    let jsonBody = req.body;
    var results = db.query(`INSERT INTO category VALUES (?, ?)`, 
    [
        '1234',
        jsonBody.categoryName
    ], function (error, results, fields) {
        //if error, print blank results
        if (error) {
            var apiResult = {};
            apiResult= {'error':error};
            res.status(500);
            res.json(apiResult);
        }
        
        //make results 
        var resultJson = JSON.stringify(results);
        resultJson = JSON.parse(resultJson);
        var apiResult = {};
        
        //add our JSON results to the data table
        apiResult = resultJson;
        
        //send JSON to Express
        res.json(apiResult);
    });
},
postUsers: function (req, res) {

    let jsonBody = req.body;
    var results = db.query(`INSERT INTO users VALUES (?, ?, ?, ?)`, 
    [
        '1234',
        jsonBody.userName,
        '1234',
        new Date()
    ], function (error, results, fields) {
        //if error, print blank results
        if (error) {
            var apiResult = {};
            apiResult= {'error':error};
            res.status(500);
            res.json(apiResult);
        }
        
        //make results 
        var resultJson = JSON.stringify(results);
        resultJson = JSON.parse(resultJson);
        var apiResult = {};
        
        //add our JSON results to the data table
        apiResult = resultJson;
        
        //send JSON to Express
        res.json(apiResult);
    });
},
postSubCategories: function (req, res) {

    let jsonBody = req.body;
    var results = db.query(`INSERT INTO subCategory VALUES (?, ?, ?)`, 
    [
        '1234',
        jsonBody.subCategoryName,
        jsonBody.categoryId
    ], function (error, results, fields) {
        //if error, print blank results
        if (error) {
            var apiResult = {};
            apiResult= {'error':error};
            res.status(500);
            res.json(apiResult);
        }
        
        //make results 
        var resultJson = JSON.stringify(results);
        resultJson = JSON.parse(resultJson);
        var apiResult = {};
        
        //add our JSON results to the data table
        apiResult = resultJson;
        
        //send JSON to Express
        res.json(apiResult);
    });
},
postSpendings: function (req, res) {

    let jsonBody = req.body;
    var results = db.query(`INSERT INTO spendings VALUES ?`, [jsonBody.data], function (error, results, fields) {
        //if error, print blank results
        if (error) {
            var apiResult = {};
            apiResult= {'error':error};
            res.status(500);
            res.json(apiResult);
        }
        
        //make results 
        var resultJson = JSON.stringify(results);
        resultJson = JSON.parse(resultJson);
        var apiResult = {};
        
        //add our JSON results to the data table
        apiResult = resultJson;
        
        //send JSON to Express
        res.json(apiResult);
    });
},
};
module.exports = Strain;
