import mysql from 'mysql2/promise';

const database = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'future_01',
  database: 'license',
  port: 3306
})

export default database;