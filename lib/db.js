// lib/db.js

const mysql = require('mysql');

const connection = mysql.createConnection({
  host: '34.121.85.101',
  user: 'root',
  database: 'los-turistas-db',
  password: 'RGPUpeE@`Xro$|j9'
});

connection.connect();
module.exports = connection;