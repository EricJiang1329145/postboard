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
      
      // 初始化默认管理员用户
      db.run(
        `INSERT OR IGNORE INTO users (id, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)`,
        ['1', 'admin', 'admin123', 'admin', new Date().toISOString()],
        (err) => {
          if (err) {
            console.error('插入管理员用户失败:', err.message);
          } else {
            console.log('管理员用户插入成功');
          }
        }
      );
      
      // 初始化示例公告1
      db.run(
        `INSERT OR IGNORE INTO announcements (id, title, content, category, author, createdAt, updatedAt, isPublished, scheduledPublishAt, publishStatus, isPinned, pinnedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          '1',
          '欢迎使用学校公告栏系统',
          '# 欢迎使用\n\n这是一个学校公告栏系统，用于发布和管理学校公告。\n\n## 功能特点\n\n- 支持Markdown格式\n- 响应式设计\n- 分类管理\n- 搜索功能\n- 置顶功能\n\n请遵守公告发布规范，文明发言。',
          '系统通知',
          '管理员',
          new Date(Date.now() - 86400000).toISOString(),
          new Date(Date.now() - 86400000).toISOString(),
          1,
          null,
          'published',
          1,
          new Date(Date.now() - 86400000).toISOString()
        ],
        (err) => {
          if (err) {
            console.error('插入示例公告1失败:', err.message);
          } else {
            console.log('示例公告1插入成功');
          }
        }
      );
      
      // 初始化示例公告2
      db.run(
        `INSERT OR IGNORE INTO announcements (id, title, content, category, author, createdAt, updatedAt, isPublished, scheduledPublishAt, publishStatus, isPinned, pinnedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          '2',
          '2024年春季学期开学通知',
          '# 2024年春季学期开学通知\n\n各位同学：\n\n根据学校安排，2024年春季学期将于2月20日正式开学，请大家提前做好准备。\n\n## 报到时间\n\n- 本科生：2月19日\n- 研究生：2月20日\n\n## 注意事项\n\n1. 请携带学生证和身份证\n2. 检查宿舍水电情况\n3. 按时参加开学典礼\n\n祝大家新学期愉快！',
          '学校通知',
          '教务处',
          new Date(Date.now() - 172800000).toISOString(),
          new Date(Date.now() - 172800000).toISOString(),
          1,
          null,
          'published',
          0,
          null
        ],
        (err) => {
          if (err) {
            console.error('插入示例公告2失败:', err.message);
          } else {
            console.log('示例公告2插入成功');
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
}

// 执行初始化
initDatabase();

console.log('数据库初始化开始...');