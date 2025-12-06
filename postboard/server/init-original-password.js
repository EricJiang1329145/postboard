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

// 初始化现有管理员的原始密码
const initOriginalPasswords = () => {
  console.log('开始初始化现有管理员的原始密码...');
  
  // 查找所有管理员
  db.all(
    `SELECT id, username, password FROM users WHERE role = 'admin'`,
    [],
    (err, rows) => {
      if (err) {
        console.error('获取管理员列表失败:', err.message);
        process.exit(1);
      }
      
      // 遍历所有管理员，初始化原始密码
      rows.forEach((user, index) => {
        let originalPassword = '无';
        
        // 如果密码是明文（不是哈希密码），使用密码作为原始密码
        if (!user.password.startsWith('$2b$')) {
          originalPassword = user.password;
        }
        
        // 更新原始密码
        db.run(
          `UPDATE users SET originalPassword = ? WHERE id = ?`,
          [originalPassword, user.id],
          (err) => {
            if (err) {
              console.error(`更新管理员 ${user.username} 的原始密码失败:`, err.message);
            } else {
              console.log(`成功更新管理员 ${user.username} 的原始密码: ${originalPassword}`);
            }
            
            // 所有管理员处理完成后关闭数据库连接
            if (index === rows.length - 1) {
              console.log('所有管理员的原始密码已初始化完成');
              db.close((err) => {
                if (err) {
                  console.error('数据库关闭失败:', err.message);
                  process.exit(1);
                } else {
                  console.log('数据库关闭成功');
                }
              });
            }
          }
        );
      });
    }
  );
};

// 执行初始化
initOriginalPasswords();
