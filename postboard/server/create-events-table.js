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

// 创建活动日历表
function createEventsTable() {
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('创建活动日历表失败:', err.message);
    } else {
      console.log('活动日历表创建成功');
    }
    
    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('数据库关闭失败:', err.message);
      } else {
        console.log('数据库关闭成功');
      }
    });
  });
}

// 执行创建表
createEventsTable();

console.log('活动日历表创建开始...');
