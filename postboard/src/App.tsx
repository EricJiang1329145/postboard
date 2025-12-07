import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore, useAnnouncementStore } from './context/useStore';

function App() {
  const { currentUser, logout } = useUserStore();
  const { checkScheduledAnnouncements } = useAnnouncementStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 添加定时检查机制，每60秒检查一次待发布的公告
  useEffect(() => {
    // 初始化时检查一次
    checkScheduledAnnouncements();
    
    // 设置定时器，每60秒检查一次
    const intervalId = setInterval(() => {
      checkScheduledAnnouncements();
    }, 60000);

    // 清理定时器
    return () => clearInterval(intervalId);
  }, [checkScheduledAnnouncements]);

  return (
    <div className="app">
      {/* 导航栏 */}
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            学校公告栏
          </Link>
          <ul className="navbar-links">
            <li>
              <Link to="/">公告列表</Link>
            </li>
            <li>
              <Link to="/events">活动日历</Link>
            </li>
            {currentUser ? (
              <>
                <li>
                  <Link to="/admin">管理面板</Link>
                </li>
                <li>
                  <button 
                    onClick={handleLogout} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#333', 
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '1rem'
                    }}
                  >
                    退出登录
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login">登录</Link>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="container" style={{ padding: '2rem 0' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
