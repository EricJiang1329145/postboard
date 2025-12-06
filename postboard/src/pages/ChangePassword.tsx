import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ChangePasswordForm } from '../types';
import { userApi } from '../services/announcementApi';

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ChangePasswordForm>({
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });
  
  const newPassword = watch('newPassword');
  
  const onSubmit = async (data: ChangePasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      setError('新密码和确认密码不一致');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await userApi.changePassword(data.oldPassword, data.newPassword);
      setSuccess('密码修改成功');
      // 清空表单
      setError('');
      // 3秒后返回首页
      setTimeout(() => {
        navigate('/admin');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '密码修改失败，请检查旧密码是否正确');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="change-password" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem 0' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>修改密码</h2>
        
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="oldPassword">旧密码</label>
            <input
              id="oldPassword"
              type="password"
              {...register('oldPassword', {
                required: '请输入旧密码'
              })}
            />
            {errors.oldPassword && (
              <div className="error" style={{ marginTop: '0.25rem', padding: '0.5rem', fontSize: '0.875rem' }}>
                {errors.oldPassword.message}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">新密码</label>
            <input
              id="newPassword"
              type="password"
              {...register('newPassword', {
                required: '请输入新密码',
                minLength: {
                  value: 6,
                  message: '新密码至少需要6个字符'
                }
              })}
            />
            {errors.newPassword && (
              <div className="error" style={{ marginTop: '0.25rem', padding: '0.5rem', fontSize: '0.875rem' }}>
                {errors.newPassword.message}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword', {
                required: '请确认新密码',
                validate: value => value === newPassword || '新密码和确认密码不一致'
              })}
            />
            {errors.confirmPassword && (
              <div className="error" style={{ marginTop: '0.25rem', padding: '0.5rem', fontSize: '0.875rem' }}>
                {errors.confirmPassword.message}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              type="submit" 
              className="primary"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? '修改中...' : '修改密码'}
            </button>
            <button 
              type="button" 
              className="secondary"
              onClick={() => navigate('/admin')}
              style={{ flex: 1 }}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;