const mysql = require('mysql2/promise');
const config = require('./config.json')
var pool = mysql.createPool(config);

module.exports = pool;


/*pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
    console.log('The solution is: ', results[0].solution);
  });*/

 