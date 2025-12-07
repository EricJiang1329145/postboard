const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
  }
});

// 为events表添加startTime和endTime字段
function addEventTimeColumns() {
  db.run(
    `ALTER TABLE events ADD COLUMN startTime TEXT`,
    (err) => {
      if (err) {
        console.error('添加startTime字段失败:', err.message);
      } else {
        console.log('startTime字段添加成功');
      }
      
      // 添加endTime字段
      db.run(
        `ALTER TABLE events ADD COLUMN endTime TEXT`,
        (err) => {
          if (err) {
            console.error('添加endTime字段失败:', err.message);
          } else {
            console.log('endTime字段添加成功');
          }
          
          // 关闭数据库连接
          db.close((err) => {
            if (err) {
              console.error('数据库关闭失败:', err.message);
            } else {
              console.log('数据库关闭成功');
            }
          });
        }
      );
    }
  );
}

// 执行添加字段操作
addEventTimeColumns();

console.log('开始为events表添加时分字段...');
