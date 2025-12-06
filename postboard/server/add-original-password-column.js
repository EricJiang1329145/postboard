const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  } else {
    console.log('数据库连接成功');
  }
});

// 添加原始密码列
const addOriginalPasswordColumn = () => {
  db.run(
    `ALTER TABLE users ADD COLUMN originalPassword TEXT`,
    (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log('原始密码列已存在');
        } else {
          console.error('添加原始密码列失败:', err.message);
          process.exit(1);
        }
      } else {
        console.log('成功添加原始密码列');
      }
      
      // 关闭数据库连接
      db.close((err) => {
        if (err) {
          console.error('数据库关闭失败:', err.message);
          process.exit(1);
        } else {
          console.log('数据库关闭成功');
        }
      });
    }
  );
};

// 执行添加列操作
addOriginalPasswordColumn();
