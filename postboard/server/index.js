const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3001;

// 配置中间件
app.use(cors()); // 允许跨域请求
app.use(morgan('dev')); // 日志记录
app.use(bodyParser.json()); // 解析 JSON 请求体
app.use(bodyParser.urlencoded({ extended: true })); // 解析 URL 编码请求体

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

// 获取单个公告
app.get('/api/announcements/:id', (req, res) => {
  const { id } = req.params;
  
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
  
  db.run(
    `INSERT INTO announcements (id, title, content, category, author, createdAt, updatedAt, isPublished, scheduledPublishAt, publishStatus, isPinned, pinnedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, title, content, category, author, createdAt, updatedAt, isPublished ? 1 : 0, scheduledPublishAt, publishStatus, isPinned ? 1 : 0, pinnedAt],
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
    
    // 构建更新语句
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
  
  db.get(
    `SELECT * FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(401).json({ error: '用户名或密码错误' });
        return;
      }
      // 删除密码字段后返回用户信息
      const { password: _, ...user } = row;
      res.json(user);
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