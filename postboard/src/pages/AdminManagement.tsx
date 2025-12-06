import React, { useState, useEffect } from 'react';
import { useUserStore } from '../context/useStore';
import { adminApi } from '../services/announcementApi';

interface Admin {
  id: string;
  username: string;
  password: string;
  originalPassword: string;
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
    originalPassword: '',
    password: '',
    confirmPassword: ''
  });
  
  // 修改密码表单
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordUpdate, setPasswordUpdate] = useState({
    adminId: '',
    originalPassword: '',
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
      await adminApi.createAdmin(newAdmin.username, newAdmin.password, newAdmin.originalPassword || newAdmin.password, 'winterless');
      setMessage('管理员添加成功');
      setNewAdmin({ username: '', originalPassword: '', password: '', confirmPassword: '' });
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
        passwordUpdate.originalPassword || passwordUpdate.newPassword, 
        'winterless'
      );
      setMessage('密码修改成功');
      setPasswordUpdate({ adminId: '', originalPassword: '', newPassword: '', confirmNewPassword: '' });
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
      <h1>管理员管理</h1>
      
      {!isWinterless && (
        <div className="alert alert-error">
          只有winterless管理员可以访问此功能
        </div>
      )}
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}
      
      {/* 添加管理员按钮 */}
      {isWinterless && (
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => {
              setShowAddForm(true);
              setShowPasswordForm(false);
            }}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer'
            }}
          >
            添加新管理员
          </button>
        </div>
      )}
      
      {/* 添加管理员表单 */}
      {showAddForm && isWinterless && (
        <div className="form-container" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h2>添加新管理员</h2>
          <form onSubmit={handleAddAdmin}>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="username">用户名</label>
              <input
                type="text"
                id="username"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="originalPassword">原始密码</label>
              <input
                type="text"
                id="originalPassword"
                placeholder="输入原始密码，用于查看和管理"
                value={newAdmin.originalPassword}
                onChange={(e) => setNewAdmin({ ...newAdmin, originalPassword: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                原始密码会被明文保存，用于管理员查看。如果不输入，将使用密码字段的值作为原始密码。
              </small>
            </div>
            
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="password">登录密码</label>
              <input
                type="password"
                id="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="confirmPassword">确认密码</label>
              <input
                type="password"
                id="confirmPassword"
                value={newAdmin.confirmPassword}
                onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#27ae60', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '添加中...' : '添加管理员'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#95a5a6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 修改密码表单 */}
      {showPasswordForm && isWinterless && (
        <div className="form-container" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h2>修改管理员密码</h2>
          <form onSubmit={handleUpdatePassword}>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="originalPassword">原始密码</label>
              <input
                type="text"
                id="originalPassword"
                placeholder="输入原始密码，用于查看和管理"
                value={passwordUpdate.originalPassword}
                onChange={(e) => setPasswordUpdate({ ...passwordUpdate, originalPassword: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                原始密码会被明文保存，用于管理员查看。如果不输入，将使用新密码作为原始密码。
              </small>
            </div>
            
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="newPassword">新登录密码</label>
              <input
                type="password"
                id="newPassword"
                value={passwordUpdate.newPassword}
                onChange={(e) => setPasswordUpdate({ ...passwordUpdate, newPassword: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="confirmNewPassword">确认新密码</label>
              <input
                type="password"
                id="confirmNewPassword"
                value={passwordUpdate.confirmNewPassword}
                onChange={(e) => setPasswordUpdate({ ...passwordUpdate, confirmNewPassword: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#27ae60', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '修改中...' : '修改密码'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowPasswordForm(false)}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#95a5a6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 管理员列表 */}
      <div className="admin-list" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>用户名</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>原始密码</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>哈希密码</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>角色</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>创建时间</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>
                  加载中...
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{admin.username}</td>
                  {/* 原始密码列 */}
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span 
                        style={{
                          backgroundColor: '#d4edda',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          wordBreak: 'break-all'
                        }}
                      >
                        {admin.originalPassword || '无'}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(admin.originalPassword || '');
                          setMessage('原始密码已复制到剪贴板');
                          setTimeout(() => setMessage(''), 2000);
                        }}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        复制
                      </button>
                    </div>
                  </td>
                  {/* 哈希密码列 */}
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span 
                        style={{
                          backgroundColor: '#f0f0f0',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '12px',
                          wordBreak: 'break-all',
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
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
                        style={{
                          padding: '2px 6px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        复制
                      </button>
                      <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                        (哈希)
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{admin.role}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {new Date(admin.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {isWinterless && (
                      <>
                        <button 
                          onClick={() => openPasswordForm(admin)}
                          style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#f39c12', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            marginRight: '5px'
                          }}
                        >
                          修改密码
                        </button>
                        <button 
                          onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                          style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#e74c3c', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer'
                          }}
                          disabled={admin.username === 'winterless'}
                        >
                          删除
                        </button>
                      </>
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
