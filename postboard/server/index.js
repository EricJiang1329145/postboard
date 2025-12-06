const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 创建multer实例
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    const filetypes = /jpe?g|png|gif|webp|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('只允许上传图片文件！'));
  }
});

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3001;

// 配置中间件
app.use(cors()); // 允许跨域请求
app.use(morgan('dev')); // 日志记录
app.use(bodyParser.json()); // 解析 JSON 请求体
app.use(bodyParser.urlencoded({ extended: true })); // 解析 URL 编码请求体

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// 创建数据库连接
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
  }
});

// 生成唯一 ID
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// 检查并发布到期的定时公告
function checkScheduledAnnouncements() {
  const now = new Date().toISOString();
  db.all(
    `SELECT id FROM announcements WHERE publishStatus = 'scheduled' AND scheduledPublishAt <= ?`,
    [now],
    (err, rows) => {
      if (err) {
        console.error('检查定时公告失败:', err.message);
        return;
      }
      
      rows.forEach(row => {
        db.run(
          `UPDATE announcements SET isPublished = 1, publishStatus = 'published', updatedAt = ? WHERE id = ?`,
          [now, row.id],
          (err) => {
            if (err) {
              console.error('更新定时公告失败:', err.message);
            } else {
              console.log(`公告 ${row.id} 已自动发布`);
            }
          }
        );
      });
    }
  );
}

// 定时检查到期的定时公告（每分钟一次）
setInterval(checkScheduledAnnouncements, 60000);

// 手动检查一次
checkScheduledAnnouncements();

// API 路由

// 获取所有公告
app.get('/api/announcements', (req, res) => {
  const { keyword, category } = req.query;
  
  let query = `SELECT * FROM announcements WHERE isPublished = 1`;
  let params = [];
  
  if (keyword) {
    query += ` AND (title LIKE ? OR content LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  query += ` ORDER BY isPinned DESC, createdAt DESC`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 用于记录最近的阅读记录，防止同一IP短时间内重复增加阅读次数
const recentReads = new Map();
const READ_COOLDOWN = 60000; // 冷却时间：1分钟（60000毫秒）

// 获取单个公告
app.get('/api/announcements/:id', (req, res) => {
  const { id } = req.params;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `${clientIP}:${id}`;
  const now = Date.now();
  
  // 检查是否在冷却时间内
  if (recentReads.has(key)) {
    const lastReadTime = recentReads.get(key);
    if (now - lastReadTime < READ_COOLDOWN) {
      // 直接获取公告，不增加阅读次数
      db.get(`SELECT * FROM announcements WHERE id = ?`, [id], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (!row) {
          res.status(404).json({ error: '公告不存在' });
          return;
        }
        res.json(row);
      });
      return;
    }
  }
  
  // 更新最近阅读记录
  recentReads.set(key, now);
  
  // 清理过期的记录，避免内存泄漏
  for (const [recordKey, timestamp] of recentReads.entries()) {
    if (now - timestamp > READ_COOLDOWN) {
      recentReads.delete(recordKey);
    }
  }
  
  // 首先增加阅读次数
  db.run(
    `UPDATE announcements SET readCount = readCount + 1 WHERE id = ?`,
    [id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 然后获取更新后的公告
      db.get(`SELECT * FROM announcements WHERE id = ?`, [id], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (!row) {
          res.status(404).json({ error: '公告不存在' });
          return;
        }
        res.json(row);
      });
    }
  );
});

// 创建公告
app.post('/api/announcements', (req, res) => {
  const { title, content, category, author, isPublished, scheduledPublishAt, isPinned } = req.body;
  
  // 验证必填字段
  if (!title || !content || !category || !author) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }
  
  // 确定发布状态
  let publishStatus = 'draft';
  if (isPublished) {
    publishStatus = 'published';
  } else if (scheduledPublishAt) {
    publishStatus = 'scheduled';
  }
  
  // 设置置顶时间
  const pinnedAt = isPinned ? new Date().toISOString() : null;
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;
  const id = generateId();
  const readCount = 0; // 默认阅读次数为0
  
  db.run(
    `INSERT INTO announcements (id, title, content, category, author, createdAt, updatedAt, isPublished, scheduledPublishAt, publishStatus, isPinned, pinnedAt, readCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, title, content, category, author, createdAt, updatedAt, isPublished ? 1 : 0, scheduledPublishAt, publishStatus, isPinned ? 1 : 0, pinnedAt, readCount],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      // 返回创建的公告
      db.get(`SELECT * FROM announcements WHERE id = ?`, [id], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json(row);
      });
    }
  );
});

// 更新公告
app.put('/api/announcements/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // 验证公告是否存在
  db.get(`SELECT * FROM announcements WHERE id = ?`, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '公告不存在' });
      return;
    }
    
    // 确定新的发布状态
    let publishStatus = row.publishStatus;
    let isPublished = row.isPublished;
    
    if (updates.isPublished !== undefined) {
      if (updates.isPublished) {
        publishStatus = 'published';
        isPublished = 1;
      } else if (updates.scheduledPublishAt) {
        publishStatus = 'scheduled';
        isPublished = 0;
      } else {
        publishStatus = 'draft';
        isPublished = 0;
      }
    } else if (updates.scheduledPublishAt) {
      publishStatus = 'scheduled';
      isPublished = 0;
    }
    
    // 更新置顶时间
    let pinnedAt = row.pinnedAt;
    if (updates.isPinned !== undefined) {
      pinnedAt = updates.isPinned ? new Date().toISOString() : null;
    }
    
    const updatedAt = new Date().toISOString();
    
    // 构建更新语句（不包括readCount字段）
    const updateFields = [
      `title = ?`,
      `content = ?`,
      `category = ?`,
      `author = ?`,
      `isPublished = ?`,
      `scheduledPublishAt = ?`,
      `publishStatus = ?`,
      `isPinned = ?`,
      `pinnedAt = ?`,
      `updatedAt = ?`
    ];
    
    const params = [
      updates.title || row.title,
      updates.content || row.content,
      updates.category || row.category,
      updates.author || row.author,
      isPublished,
      updates.scheduledPublishAt || row.scheduledPublishAt,
      publishStatus,
      updates.isPinned !== undefined ? (updates.isPinned ? 1 : 0) : row.isPinned,
      pinnedAt,
      updatedAt,
      id
    ];
    
    db.run(
      `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = ?`,
      params,
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        // 返回更新后的公告
        db.get(`SELECT * FROM announcements WHERE id = ?`, [id], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json(row);
        });
      }
    );
  });
});

// 删除公告
app.delete('/api/announcements/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(`DELETE FROM announcements WHERE id = ?`, [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: '公告删除成功' });
  });
});

// 用户登录
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // 先根据用户名查找用户
  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(401).json({ error: '用户名或密码错误' });
        return;
      }
      
      // 检查密码是否是哈希密码（bcrypt哈希以$2b$开头）
      const isHashedPassword = row.password.startsWith('$2b$');
      
      // 验证密码
      let passwordMatch = false;
      if (isHashedPassword) {
        // 使用bcrypt验证哈希密码
        bcrypt.compare(password, row.password, (bcryptErr, result) => {
          if (bcryptErr) {
            res.status(500).json({ error: bcryptErr.message });
            return;
          }
          if (!result) {
            res.status(401).json({ error: '用户名或密码错误' });
            return;
          }
          
          // 删除密码字段后返回用户信息
          const { password: _, ...user } = row;
          res.json(user);
        });
      } else {
        // 直接比较明文密码（用于向后兼容）
        passwordMatch = password === row.password;
        if (!passwordMatch) {
          res.status(401).json({ error: '用户名或密码错误' });
          return;
        }
        
        // 删除密码字段后返回用户信息
        const { password: _, ...user } = row;
        res.json(user);
      }
    }
  );
});

// 修改密码
app.post('/api/auth/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  // 首先获取当前登录用户（这里假设只有一个admin用户，实际项目中应该使用认证令牌）
  db.get(
    `SELECT * FROM users WHERE role = 'admin'`,
    [],
    (err, user) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!user) {
        res.status(404).json({ error: '用户不存在' });
        return;
      }
      
      // 验证旧密码
      const isHashedPassword = user.password.startsWith('$2b$');
      
      const validatePassword = (isValid) => {
        if (!isValid) {
          res.status(401).json({ error: '旧密码错误' });
          return;
        }
        
        // 哈希新密码
        bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            res.status(500).json({ error: hashErr.message });
            return;
          }
          
          // 更新密码
          db.run(
            `UPDATE users SET password = ?, updatedAt = ? WHERE id = ?`,
            [hashedPassword, new Date().toISOString(), user.id],
            (updateErr) => {
              if (updateErr) {
                res.status(500).json({ error: updateErr.message });
                return;
              }
              res.json({ success: true, message: '密码修改成功' });
            }
          );
        });
      };
      
      if (isHashedPassword) {
        // 使用bcrypt验证哈希密码
        bcrypt.compare(oldPassword, user.password, (bcryptErr, result) => {
          if (bcryptErr) {
            res.status(500).json({ error: bcryptErr.message });
            return;
          }
          validatePassword(result);
        });
      } else {
        // 直接比较明文密码（用于向后兼容）
        validatePassword(oldPassword === user.password);
      }
    }
  );
});

// 管理员管理 API（仅允许 winterless 用户访问）
const isWinterlessUser = (req, res, next) => {
  // 检查当前请求的用户是否是 winterless
  // 注意：在实际项目中，应该使用认证令牌来获取当前用户
  // 这里为了简化，我们假设只有 winterless 用户需要访问这些 API
  // 在前端调用时，需要传递当前登录用户的信息
  const { username } = req.body;
  if (username !== 'winterless') {
    res.status(403).json({ error: '没有权限访问此功能' });
    return;
  }
  next();
};

// 获取所有管理员
app.get('/api/admins', (req, res) => {
  db.all(
    `SELECT id, username, password, originalPassword, role, createdAt FROM users WHERE role = 'admin'`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// 新增管理员
app.post('/api/admins', (req, res) => {
  const { username, password, originalPassword, currentUser } = req.body;
  
  // 只有 winterless 用户可以添加管理员
  if (currentUser !== 'winterless') {
    res.status(403).json({ error: '只有winterless管理员可以添加新管理员' });
    return;
  }
  
  // 检查用户名是否已存在
  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    (err, existingUser) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (existingUser) {
        res.status(400).json({ error: '用户名已存在' });
        return;
      }
      
      // 哈希密码
      bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
        if (hashErr) {
          res.status(500).json({ error: hashErr.message });
          return;
        }
        
        // 生成唯一ID
        const id = Date.now().toString();
        const createdAt = new Date().toISOString();
        
        // 插入新管理员，保存原始密码
        db.run(
          `INSERT INTO users (id, username, password, originalPassword, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, username, hashedPassword, originalPassword || password, 'admin', createdAt],
          (insertErr) => {
            if (insertErr) {
              res.status(500).json({ error: insertErr.message });
              return;
            }
            res.json({ success: true, message: '管理员添加成功' });
          }
        );
      });
    }
  );
});

// 修改管理员密码
app.put('/api/admins/:id/password', (req, res) => {
  const { id } = req.params;
  const { newPassword, originalPassword, currentUser } = req.body;
  
  // 只有 winterless 用户可以修改管理员密码
  if (currentUser !== 'winterless') {
    res.status(403).json({ error: '只有winterless管理员可以修改管理员密码' });
    return;
  }
  
  // 哈希新密码
  bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
    if (hashErr) {
      res.status(500).json({ error: hashErr.message });
      return;
    }
    
    // 更新密码和原始密码
    db.run(
      `UPDATE users SET password = ?, originalPassword = ?, updatedAt = ? WHERE id = ? AND role = 'admin'`,
      [hashedPassword, originalPassword || newPassword, new Date().toISOString(), id],
      (updateErr) => {
        if (updateErr) {
          res.status(500).json({ error: updateErr.message });
          return;
        }
        res.json({ success: true, message: '管理员密码修改成功' });
      }
    );
  });
});

// 删除管理员
app.delete('/api/admins/:id', (req, res) => {
  const { id } = req.params;
  const { currentUser } = req.body;
  
  // 只有 winterless 用户可以删除管理员
  if (currentUser !== 'winterless') {
    res.status(403).json({ error: '只有winterless管理员可以删除管理员' });
    return;
  }
  
  // 不允许删除自己
  db.get(
    `SELECT username FROM users WHERE id = ?`,
    [id],
    (err, user) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!user) {
        res.status(404).json({ error: '管理员不存在' });
        return;
      }
      if (user.username === 'winterless') {
        res.status(400).json({ error: '不允许删除自己' });
        return;
      }
      
      // 删除管理员
      db.run(
        `DELETE FROM users WHERE id = ? AND role = 'admin'`,
        [id],
        (deleteErr) => {
          if (deleteErr) {
            res.status(500).json({ error: deleteErr.message });
            return;
          }
          res.json({ success: true, message: '管理员删除成功' });
        }
      );
    }
  );
});

// 获取所有分类
app.get('/api/categories', (req, res) => {
  db.all(`SELECT DISTINCT category FROM announcements`, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const categories = rows.map(row => row.category);
    res.json(categories);
  });
});

// 图片上传路由
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    // 返回图片URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      url: imageUrl,
      filename: req.file.filename 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有公告（管理员）
app.get('/api/admin/announcements', (req, res) => {
  db.all(`SELECT * FROM announcements ORDER BY isPinned DESC, createdAt DESC`, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 导出应用（用于测试）
module.exports = app;