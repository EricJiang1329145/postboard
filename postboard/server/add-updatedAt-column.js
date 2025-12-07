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

// 添加updatedAt列到users表
const addUpdatedAtColumn = () => {
  console.log('开始添加updatedAt列到users表...');
  
  // 检查users表结构
  db.all(
    `PRAGMA table_info(users)`,
    [],
    (err, columns) => {
      if (err) {
        console.error('获取表结构失败:', err.message);
        process.exit(1);
      }
      
      // 检查是否已经存在updatedAt列
      const hasUpdatedAt = columns.some(col => col.name === 'updatedAt');
      
      if (hasUpdatedAt) {
        console.log('users表已经有updatedAt列，无需添加');
        db.close();
        return;
      }
      
      // 添加updatedAt列
      db.run(
        `ALTER TABLE users ADD COLUMN updatedAt TEXT`,
        (err) => {
          if (err) {
            console.error('添加updatedAt列失败:', err.message);
            process.exit(1);
          }
          
          console.log('成功添加updatedAt列');
          
          // 更新现有记录的updatedAt值
          updateExistingRecords();
        }
      );
    }
  );
};

// 更新现有记录的updatedAt值
const updateExistingRecords = () => {
  console.log('开始更新现有记录的updatedAt值...');
  
  db.run(
    `UPDATE users SET updatedAt = createdAt WHERE updatedAt IS NULL`,
    (err) => {
      if (err) {
        console.error('更新现有记录的updatedAt值失败:', err.message);
        process.exit(1);
      }
      
      console.log('成功更新所有记录的updatedAt值');
      
      // 查看更新后的表结构
      verifyTableStructure();
    }
  );
};

// 验证表结构
const verifyTableStructure = () => {
  console.log('\n验证users表结构:');
  db.all(
    `PRAGMA table_info(users)`,
    [],
    (err, columns) => {
      if (err) {
        console.error('验证表结构失败:', err.message);
        process.exit(1);
      }
      
      columns.forEach(col => {
        console.log(`  ${col.name} (${col.type})`);
      });
      
      console.log('\n操作完成，数据库关闭');
      db.close();
    }
  );
};

// 执行添加列操作
addUpdatedAtColumn();
