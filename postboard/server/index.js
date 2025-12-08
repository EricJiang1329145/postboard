const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const schedule = require('node-schedule');
const xss = require('xss'); // 引入XSS过滤库

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
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://ericjiang1329145.github.io'], // 允许GitHub Pages域名
  credentials: true, // 允许携带凭证
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的HTTP方法
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'] // 允许的请求头
})); // 配置CORS策略
app.use(morgan('dev')); // 日志记录
app.use(bodyParser.json()); // 解析 JSON 请求体
app.use(bodyParser.urlencoded({ extended: true })); // 解析 URL 编码请求体

// 生成CSRF令牌
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 存储CSRF令牌（实际项目中应使用session或redis存储）
const csrfTokens = new Map(); // key: userId, value: token

// CSRF令牌验证中间件
const csrfProtection = (req, res, next) => {
  // 允许GET请求通过（GET请求通常不会修改数据）
  if (req.method === 'GET') {
    return next();
  }
  
  // 检查Origin或Referer头
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://ericjiang1329145.github.io'];
  
  // 检查Origin是否在允许列表中
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: '无效的Origin头' });
  }
  
  // 检查Referer是否在允许列表中
  if (referer) {
    const refererOrigin = referer.split('/').slice(0, 3).join('/');
    if (!allowedOrigins.includes(refererOrigin)) {
      return res.status(403).json({ error: '无效的Referer头' });
    }
  }
  
  // 从请求头中获取CSRF令牌
  const csrfToken = req.get('X-CSRF-Token');
  
  // 检查CSRF令牌是否存在且有效
  // 注意：这里简化了验证逻辑，实际项目中应从session或数据库中获取并验证令牌
  // 由于当前项目没有使用session，我们暂时跳过令牌验证，仅验证Origin和Referer头
  
  next();
};

// 应用CSRF保护中间件到所有非GET请求
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    csrfProtection(req, res, next);
  } else {
    next();
  }
});

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

// 计算文件哈希值
const calculateHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// 解析内容中的图片URL
const extractImageUrls = (content) => {
  const imageUrlRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  const urls = [];
  let match;
  
  while ((match = imageUrlRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
};

// 更新图片引用计数
const updateImageReferences = async (oldContent, newContent) => {
  return new Promise((resolve, reject) => {
    // 解析旧内容和新内容中的图片URL
    const oldUrls = oldContent ? extractImageUrls(oldContent) : [];
    const newUrls = newContent ? extractImageUrls(newContent) : [];
    
    // 找出需要增加和减少引用计数的图片
    const urlsToAdd = newUrls.filter(url => !oldUrls.includes(url));
    const urlsToRemove = oldUrls.filter(url => !newUrls.includes(url));
    
    // 减少引用计数
    const decrementPromises = urlsToRemove.map(url => {
      return new Promise((resolveDecrement, rejectDecrement) => {
        db.run(
          `UPDATE images SET referenceCount = MAX(referenceCount - 1, 0), updatedAt = ? WHERE url = ?`,
          [new Date().toISOString(), url],
          (err) => {
            if (err) rejectDecrement(err);
            else resolveDecrement();
          }
        );
      });
    });
    
    // 增加引用计数
    const incrementPromises = urlsToAdd.map(url => {
      return new Promise((resolveIncrement, rejectIncrement) => {
        db.run(
          `UPDATE images SET referenceCount = referenceCount + 1, updatedAt = ? WHERE url = ?`,
          [new Date().toISOString(), url],
          (err) => {
            if (err) rejectIncrement(err);
            else resolveIncrement();
          }
        );
      });
    });
    
    // 执行所有更新
    Promise.all([...decrementPromises, ...incrementPromises])
      .then(() => resolve())
      .catch(err => reject(err));
  });
};

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

// 定期清理未使用的图片（每天凌晨2点执行）
const cleanupUnusedImages = () => {
  try {
    console.log('开始清理未使用的图片...');
    
    // 找出引用计数为0且超过30天的图片
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    db.all(
      `SELECT id, filename, url FROM images WHERE referenceCount = 0 AND createdAt < ?`,
      [thirtyDaysAgo],
      (err, unusedImages) => {
        if (err) {
          console.error('查询未使用图片失败:', err.message);
          return;
        }
        
        console.log(`找到 ${unusedImages.length} 张未使用的图片`);
        
        // 删除每张图片
        unusedImages.forEach(image => {
          const filePath = path.join(uploadsDir, image.filename);
          
          // 删除图片文件
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`删除图片文件: ${filePath}`);
          } else {
            console.log(`图片文件不存在: ${filePath}`);
          }
          
          // 从数据库中移除
          db.run(
            `DELETE FROM images WHERE id = ?`,
            [image.id],
            (err) => {
              if (err) {
                console.error(`从数据库中删除图片失败: ${image.id}`, err.message);
              } else {
                console.log(`从数据库中删除图片: ${image.id}`);
              }
            }
          );
        });
        
        console.log('未使用图片清理完成');
      }
    );
  } catch (error) {
    console.error('清理未使用图片失败:', error.message);
  }
};

// 每天凌晨2点执行清理任务
schedule.scheduleJob('0 2 * * *', cleanupUnusedImages);

// 手动运行一次清理任务（用于测试）
// cleanupUnusedImages();

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
  // 对用户输入进行XSS过滤
  const title = xss(req.body.title || '');
  const content = xss(req.body.content || '');
  const category = xss(req.body.category || '');
  const author = xss(req.body.author || '');
  const { isPublished, scheduledPublishAt, isPinned } = req.body;
  
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
      
      // 更新图片引用计数
      if (content) {
        const imageUrls = extractImageUrls(content);
        imageUrls.forEach(url => {
          db.run(
            `UPDATE images SET referenceCount = referenceCount + 1, updatedAt = ? WHERE url = ?`,
            [createdAt, url]
          );
        });
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
    
    // 获取旧内容和新内容
    const oldContent = row.content;
    // 对用户输入进行XSS过滤
    const newContent = xss(updates.content || row.content);
    const newTitle = xss(updates.title || row.title);
    const newCategory = xss(updates.category || row.category);
    const newAuthor = xss(updates.author || row.author);
    
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
      newTitle,
      newContent,
      newCategory,
      newAuthor,
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
        
        // 更新图片引用计数
        if (oldContent !== newContent) {
          // 解析旧内容和新内容中的图片URL
          const oldUrls = extractImageUrls(oldContent);
          const newUrls = extractImageUrls(newContent);
          
          // 找出需要增加和减少引用计数的图片
          const urlsToAdd = newUrls.filter(url => !oldUrls.includes(url));
          const urlsToRemove = oldUrls.filter(url => !newUrls.includes(url));
          
          // 减少不再使用的图片的引用计数
          urlsToRemove.forEach(url => {
            db.run(
              `UPDATE images SET referenceCount = MAX(referenceCount - 1, 0), updatedAt = ? WHERE url = ?`,
              [updatedAt, url]
            );
          });
          
          // 增加新图片的引用计数
          urlsToAdd.forEach(url => {
            db.run(
              `UPDATE images SET referenceCount = referenceCount + 1, updatedAt = ? WHERE url = ?`,
              [updatedAt, url]
            );
          });
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
  
  // 先获取公告内容，用于更新图片引用计数
  db.get(`SELECT content FROM announcements WHERE id = ?`, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: '获取公告内容失败' });
      return;
    }
    
    const content = row?.content;
    
    // 删除公告
    db.run(`DELETE FROM announcements WHERE id = ?`, [id], (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 更新图片引用计数
      if (content) {
        const imageUrls = extractImageUrls(content);
        const updatedAt = new Date().toISOString();
        
        imageUrls.forEach(url => {
          db.run(
            `UPDATE images SET referenceCount = MAX(referenceCount - 1, 0), updatedAt = ? WHERE url = ?`,
            [updatedAt, url]
          );
        });
      }
      
      res.json({ message: '公告删除成功' });
    });
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
    `SELECT id, username, password, role, createdAt FROM users WHERE role = 'admin'`,
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
  const { username, password, currentUser } = req.body;
  
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
        
        // 插入新管理员
        db.run(
          `INSERT INTO users (id, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)`,
          [id, username, hashedPassword, 'admin', createdAt],
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
  const { newPassword, currentUser } = req.body;
  
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
    
    // 更新密码
    db.run(
      `UPDATE users SET password = ?, updatedAt = ? WHERE id = ? AND role = 'admin'`,
      [hashedPassword, new Date().toISOString(), id],
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
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    // 计算图片哈希
    const hash = await calculateHash(req.file.path);
    
    // 检查哈希值是否已存在
    db.get(`SELECT * FROM images WHERE hash = ?`, [hash], async (err, existingImage) => {
      if (err) {
        res.status(500).json({ error: '查询图片哈希失败' });
        return;
      }
      
      if (existingImage) {
        // 重复图片，删除临时文件，返回现有图片URL
        fs.unlinkSync(req.file.path);
        res.json({ 
          success: true, 
          url: existingImage.url,
          filename: existingImage.filename,
          duplicate: true // 标记为重复图片
        });
      } else {
        // 新图片，生成URL
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        const id = generateId();
        const now = new Date().toISOString();
        
        // 保存图片信息到数据库
        db.run(
          `INSERT INTO images (id, hash, filename, url, referenceCount, createdAt, updatedAt, size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, hash, req.file.filename, imageUrl, 0, now, now, req.file.size],
          (err) => {
            if (err) {
              // 如果保存失败，删除上传的文件
              fs.unlinkSync(req.file.path);
              res.status(500).json({ error: '保存图片信息失败' });
              return;
            }
            
            // 返回图片URL
            res.json({ 
              success: true, 
              url: imageUrl,
              filename: req.file.filename,
              duplicate: false // 标记为新图片
            });
          }
        );
      }
    });
  } catch (error) {
    // 如果计算哈希失败，删除上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
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

// 活动日历 API 路由

// 获取所有活动
app.get('/api/events', (req, res) => {
  db.all(`SELECT * FROM events ORDER BY startDate ASC`, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 获取单个活动
app.get('/api/events/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT * FROM events WHERE id = ?`, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '活动不存在' });
      return;
    }
    res.json(row);
  });
});

// 格式化日期为YYYY-MM-DD格式（仅保留到天）
const formatDateToDay = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 10);
};

// 创建活动
app.post('/api/events', (req, res) => {
  let { title, description, startDate, endDate, startTime, endTime } = req.body;
  
  // 验证必填字段
  if (!title || !description || !startDate || !endDate) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }
  
  // 格式化日期，仅保留到天
  startDate = formatDateToDay(startDate);
  endDate = formatDateToDay(endDate);
  
  // 验证结束时间晚于开始时间
  if (new Date(endDate) < new Date(startDate)) {
    res.status(400).json({ error: '结束时间必须晚于或等于开始时间' });
    return;
  }
  
  // 防止重复添加完全相同的活动
  db.get(
    `SELECT * FROM events WHERE title = ? AND description = ? AND startDate = ? AND endDate = ? AND startTime = ? AND endTime = ?`,
    [title, description, startDate, endDate, startTime || null, endTime || null],
    (err, existingEvent) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (existingEvent) {
        res.status(400).json({ error: '已存在完全相同的活动' });
        return;
      }
      
      // 创建新活动
      const createdAt = new Date().toISOString();
      const updatedAt = createdAt;
      const id = generateId();
      
      db.run(
        `INSERT INTO events (id, title, description, startDate, endDate, startTime, endTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, description, startDate, endDate, startTime || null, endTime || null, createdAt, updatedAt],
        (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          // 返回创建的活动
          db.get(`SELECT * FROM events WHERE id = ?`, [id], (err, row) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.status(201).json(row);
          });
        }
      );
    }
  );
});

// 更新活动
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // 验证活动是否存在
  db.get(`SELECT * FROM events WHERE id = ?`, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '活动不存在' });
      return;
    }
    
    // 格式化日期，仅保留到天
    const startDate = updates.startDate ? formatDateToDay(updates.startDate) : row.startDate;
    const endDate = updates.endDate ? formatDateToDay(updates.endDate) : row.endDate;
    
    // 验证结束时间晚于开始时间
    if (new Date(endDate) < new Date(startDate)) {
      res.status(400).json({ error: '结束时间必须晚于或等于开始时间' });
      return;
    }
    
    // 防止重复添加完全相同的活动（排除当前活动）
    db.get(
      `SELECT * FROM events WHERE title = ? AND description = ? AND startDate = ? AND endDate = ? AND startTime = ? AND endTime = ? AND id != ?`,
      [
        updates.title || row.title,
        updates.description || row.description,
        startDate,
        endDate,
        updates.startTime || null,
        updates.endTime || null,
        id
      ],
      (err, existingEvent) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (existingEvent) {
          res.status(400).json({ error: '已存在完全相同的活动' });
          return;
        }
        
        // 更新活动
        const updatedAt = new Date().toISOString();
        
        db.run(
          `UPDATE events SET title = ?, description = ?, startDate = ?, endDate = ?, startTime = ?, endTime = ?, updatedAt = ? WHERE id = ?`,
          [
            updates.title || row.title,
            updates.description || row.description,
            startDate,
            endDate,
            updates.startTime || null,
            updates.endTime || null,
            updatedAt,
            id
          ],
          (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            
            // 返回更新后的活动
            db.get(`SELECT * FROM events WHERE id = ?`, [id], (err, row) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              res.json(row);
            });
          }
        );
      }
    );
  });
});

// 删除活动
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  
  // 验证活动是否存在
  db.get(`SELECT * FROM events WHERE id = ?`, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '活动不存在' });
      return;
    }
    
    // 删除活动
    db.run(`DELETE FROM events WHERE id = ?`, [id], (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: '活动删除成功' });
    });
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 导出应用（用于测试）
module.exports = app;