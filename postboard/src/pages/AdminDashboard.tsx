import { Outlet, NavLink } from 'react-router-dom';
import '../styles/AdminPanel.css';

const AdminDashboard = () => {
  return (
    <div className="admin-panel">
      {/* 侧边栏导航 */}
      <aside className="admin-sidebar">
        <h2>管理面板</h2>
        <ul>
          <li>
            <NavLink to="/admin/create" className={({ isActive }) => isActive ? 'active' : ''}>
              创建公告
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/announcements" className={({ isActive }) => isActive ? 'active' : ''}>
              公告管理
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/admin-management" className={({ isActive }) => isActive ? 'active' : ''}>
              管理员管理
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/change-password" className={({ isActive }) => isActive ? 'active' : ''}>
              修改密码
            </NavLink>
          </li>
        </ul>
      </aside>
      
      {/* 主内容区域 */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
