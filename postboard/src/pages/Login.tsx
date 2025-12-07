import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useUserStore } from '../context/useStore';
import { LoginForm } from '../types';

// 登录表单验证规则
const loginSchema = yup.object().shape({
  username: yup.string().required('用户名不能为空'),
  password: yup.string().required('密码不能为空')
});

const Login = () => {
  const { login } = useUserStore();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: yupResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    const success = await login(data.username, data.password);
    if (success) {
      navigate('/admin');
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="login-page" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem 0' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>管理员登录</h2>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              type="text"
              {...register('username')}
            />
            {errors.username && <div className="error" style={{ marginTop: '0.25rem', padding: '0.5rem', fontSize: '0.875rem' }}>{errors.username.message}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              {...register('password')}
            />
            {errors.password && <div className="error" style={{ marginTop: '0.25rem', padding: '0.5rem', fontSize: '0.875rem' }}>{errors.password.message}</div>}
          </div>
          
          <button type="submit" className="primary" style={{ marginTop: '1rem' }}>
            登录
          </button>
          
          {/* <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#7f8c8d' }}>
            <p>测试账号: admin</p>
            <p>测试密码: admin123</p>
          </div> */}
        </form>
      </div>
    </div>
  );
};

export default Login;
