import mysql from 'mysql2/promise';

// DB 정보
const database = mysql.createPool({
  // host: '127.0.0.1',
  host: 'localhost',
  user: 'root',
  password: 'future_01',
  database: 'license',
  port: 3306
})

// 추후 환경변수 사용용
// const database = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: Number(process.env.DB_PORT) || 3306
// });

// DB 연결 함수
export async function getDBConnection() {
  return await database.getConnection();
}

// 쿼리 실행 함수 - 제네릭 추가
export async function query<T = any>(sql: string, values: any[] = []): Promise<T> {
  let connection;
  try {
    connection = await getDBConnection();
    const [results] = await connection.execute(sql, values);
    return results as T;
  } catch (error) {
    console.error("Database Query Error:", error);
    throw new Error("Database query failed");
  } finally {
    if (connection) connection.release();
  }
}
