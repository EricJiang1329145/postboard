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

// 创建图片元数据表
const createImagesTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      hash TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      referenceCount INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      size INTEGER NOT NULL
    );
  `;

  db.run(createTableQuery, (err) => {
    if (err) {
      console.error('创建图片元数据表失败:', err.message);
      process.exit(1);
    } else {
      console.log('图片元数据表创建成功');
      
      // 创建索引
      const createIndexQuery = `
        CREATE INDEX IF NOT EXISTS idx_images_hash ON images (hash);
        CREATE INDEX IF NOT EXISTS idx_images_reference_count ON images (referenceCount);
        CREATE INDEX IF NOT EXISTS idx_images_created_at ON images (createdAt);
      `;
      
      db.exec(createIndexQuery, (err) => {
        if (err) {
          console.error('创建索引失败:', err.message);
          process.exit(1);
        } else {
          console.log('索引创建成功');
          console.log('图片元数据表创建完成');
          db.close();
        }
      });
    }
  });
};

// 执行创建表操作
createImagesTable();
