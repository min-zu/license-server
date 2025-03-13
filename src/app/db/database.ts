import mysql from 'mysql2/promise';

// DB 정보
const database = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'future_01',
  database: 'license',
  port: 3306
})

// DB 연결 함수
export async function getDBConnection() {
  return await database.getConnection();
}

// 쿼리 실행 함수
export async function query(sql: string, values: any[] = []) {
  const connection = await getDBConnection();
  const [results] = await connection.execute(sql, values);
  connection.release();
  return results;
}
