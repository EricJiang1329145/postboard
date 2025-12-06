const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// 创建数据库连接
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
  }
});

// 初始化数据库函数
function initDatabase() {
  // 创建用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('创建用户表失败:', err.message);
      return;
    }
    console.log('用户表创建成功');
    
    // 创建公告表
    db.run(`CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      author TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      isPublished BOOLEAN NOT NULL,
      scheduledPublishAt TEXT,
      publishStatus TEXT NOT NULL,
      isPinned BOOLEAN NOT NULL,
      pinnedAt TEXT
    )`, (err) => {
      if (err) {
        console.error('创建公告表失败:', err.message);
        return;
      }
      console.log('公告表创建成功');
      
      // 生成bcrypt哈希密码
      bcrypt.hash('admin123', 10, (hashErr, hashedPassword) => {
        if (hashErr) {
          console.error('密码哈希失败:', hashErr.message);
          return;
        }
        
        // 初始化默认管理员用户
        db.run(
          `INSERT OR IGNORE INTO users (id, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)`,
          ['1', 'admin', hashedPassword, 'admin', new Date().toISOString()],
          (err) => {
            if (err) {
              console.error('插入管理员用户失败:', err.message);
            } else {
              console.log('管理员用户插入成功');
            }
            
            // 所有操作完成后关闭数据库连接
            db.close((err) => {
              if (err) {
                console.error('数据库关闭失败:', err.message);
              } else {
                console.log('数据库关闭成功');
              }
            });
          }
        );
      });
    });
  });
}

// 执行初始化
initDatabase();

console.log('数据库初始化开始...');