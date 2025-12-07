import React, { useState, useEffect } from 'react';
import { useUserStore } from '../context/useStore';
import { adminApi } from '../services/announcementApi';

interface Admin {
  id: string;
  username: string;
  password: string;

  role: string;
  createdAt: string;
}

const AdminManagement: React.FC = () => {
  const { currentUser } = useUserStore();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // 添加管理员表单
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  // 修改密码表单
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordUpdate, setPasswordUpdate] = useState({
    adminId: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  // 加载所有管理员
  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllAdmins();
      setAdmins(data);
      setError('');
    } catch (err) {
      setError('加载管理员列表失败');
      console.error('加载管理员列表失败:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadAdmins();
  }, []);
  
  // 检查当前用户是否是winterless
  const isWinterless = currentUser?.username === 'winterless';
  
  // 处理添加管理员
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isWinterless) {
      setError('只有winterless管理员可以添加新管理员');
      return;
    }
    
    if (newAdmin.password !== newAdmin.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    try {
      setLoading(true);
      await adminApi.createAdmin(newAdmin.username, newAdmin.password, 'winterless');
      setMessage('管理员添加成功');
      setNewAdmin({ username: '', password: '', confirmPassword: '' });
      setShowAddForm(false);
      loadAdmins();
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '添加管理员失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理修改密码
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isWinterless) {
      setError('只有winterless管理员可以修改管理员密码');
      return;
    }
    
    if (passwordUpdate.newPassword !== passwordUpdate.confirmNewPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    try {
      setLoading(true);
      await adminApi.updateAdminPassword(
        passwordUpdate.adminId, 
        passwordUpdate.newPassword, 

        'winterless'
      );
      setMessage('密码修改成功');
      setPasswordUpdate({ adminId: '', newPassword: '', confirmNewPassword: '' });
      setShowPasswordForm(false);
      loadAdmins();
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '修改密码失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理删除管理员
  const handleDeleteAdmin = async (adminId: string, username: string) => {
    if (!isWinterless) {
      setError('只有winterless管理员可以删除管理员');
      return;
    }
    
    if (username === 'winterless') {
      setError('不允许删除自己');
      return;
    }
    
    if (!window.confirm(`确定要删除管理员 ${username} 吗？`)) {
      return;
    }
    
    try {
      setLoading(true);
      await adminApi.deleteAdmin(adminId, 'winterless');
      setMessage('管理员删除成功');
      loadAdmins();
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '删除管理员失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 打开修改密码表单
  const openPasswordForm = (admin: Admin) => {
    setPasswordUpdate({
      adminId: admin.id,
      newPassword: '',
      confirmNewPassword: ''
    });
    setShowPasswordForm(true);
    setShowAddForm(false);
  };
  
  return (
    <div className="admin-management-page">
      <div className="page-title">
        <h1>管理员管理</h1>
      </div>
      
      {!isWinterless && (
        <div className="card error-message p-4 mb-4">
          只有winterless管理员可以访问此功能
        </div>
      )}
      
      {error && (
        <div className="card error-message p-4 mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="card success-message p-4 mb-4">
          {message}
        </div>
      )}
      
      {/* 添加管理员按钮 */}
      {isWinterless && (
        <div className="mb-4">
          <button 
            onClick={() => {
              setShowAddForm(true);
              setShowPasswordForm(false);
            }}
            className="btn btn-primary"
          >
            添加新管理员
          </button>
        </div>
      )}
      
      {/* 添加管理员表单 */}
      {showAddForm && isWinterless && (
        <div className="card mb-4 p-6 fade-in">
          <h2 className="mb-4">添加新管理员</h2>
          <form onSubmit={handleAddAdmin}>
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                type="text"
                id="username"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">登录密码</label>
              <input
                type="password"
                id="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">确认密码</label>
              <input
                type="password"
                id="confirmPassword"
                value={newAdmin.confirmPassword}
                onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                required
                className="form-input"
              />
            </div>
            
            <div className="button-group mt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? '添加中...' : '添加管理员'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 修改密码表单 */}
      {showPasswordForm && isWinterless && (
        <div className="card mb-4 p-6 fade-in">
          <h2 className="mb-4">修改管理员密码</h2>
          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label htmlFor="newPassword">新登录密码</label>
              <input
                type="password"
                id="newPassword"
                value={passwordUpdate.newPassword}
                onChange={(e) => setPasswordUpdate({ ...passwordUpdate, newPassword: e.target.value })}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmNewPassword">确认新密码</label>
              <input
                type="password"
                id="confirmNewPassword"
                value={passwordUpdate.confirmNewPassword}
                onChange={(e) => setPasswordUpdate({ ...passwordUpdate, confirmNewPassword: e.target.value })}
                required
                className="form-input"
              />
            </div>
            
            <div className="button-group mt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? '修改中...' : '修改密码'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowPasswordForm(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 管理员列表 */}
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>原始密码</th>
              <th>哈希密码</th>
              <th>角色</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  加载中...
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  没有找到管理员
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="fade-in">
                  <td className="py-3 px-4">{admin.username}</td>

                  {/* 哈希密码列 */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        className="truncate max-w-xs"
                        title={admin.password}
                      >
                        {admin.password}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(admin.password);
                          setMessage('哈希密码已复制到剪贴板');
                          setTimeout(() => setMessage(''), 2000);
                        }}
                        className="btn btn-sm btn-secondary"
                      >
                        复制
                      </button>
                      <span className="text-sm text-muted">
                        (哈希)
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{admin.role}</td>
                  <td className="py-3 px-4">
                    {new Date(admin.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {isWinterless && (
                      <div className="button-group flex gap-1">
                        <button 
                          onClick={() => openPasswordForm(admin)}
                          className="btn btn-sm btn-warning"
                        >
                          修改密码
                        </button>
                        <button 
                          onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                          className="btn btn-sm btn-danger"
                          disabled={admin.username === 'winterless'}
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminManagement;
