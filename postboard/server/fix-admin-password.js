const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

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

// 修复admin用户的密码，将明文密码转换为哈希密码
const fixAdminPassword = () => {
  console.log('开始修复admin用户的密码...');
  
  // 查找admin用户
  db.get(
    `SELECT id, username, password, originalPassword FROM users WHERE username = 'admin'`,
    [],
    (err, user) => {
      if (err) {
        console.error('获取admin用户信息失败:', err.message);
        process.exit(1);
      }
      
      if (!user) {
        console.error('未找到admin用户');
        process.exit(1);
      }
      
      console.log(`当前admin用户信息:`);
      console.log(`  用户名: ${user.username}`);
      console.log(`  密码: ${user.password}`);
      console.log(`  原始密码: ${user.originalPassword}`);
      
      // 检查密码是否已经是哈希格式
      if (user.password.startsWith('$2b$')) {
        console.log('admin用户密码已经是哈希格式，无需修复');
        db.close();
        return;
      }
      
      // 哈希密码
      const plainPassword = user.password;
      bcrypt.hash(plainPassword, 10, (hashErr, hashedPassword) => {
        if (hashErr) {
          console.error('密码哈希失败:', hashErr.message);
          process.exit(1);
        }
        
        // 更新admin用户的密码为哈希格式，保持原始密码不变
        db.run(
          `UPDATE users SET password = ? WHERE id = ?`,
          [hashedPassword, user.id],
          (err) => {
            if (err) {
              console.error('更新admin用户密码失败:', err.message);
              process.exit(1);
            } else {
              console.log('admin用户密码修复成功!');
              console.log(`  原始密码: ${user.originalPassword || plainPassword}`);
              console.log(`  哈希密码: ${hashedPassword}`);
              
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
          }
        );
      });
    }
  );
};

// 执行修复
fixAdminPassword();
