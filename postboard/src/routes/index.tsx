import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import AnnouncementList from '../pages/AnnouncementList';
import AnnouncementDetail from '../pages/AnnouncementDetail';
import Login from '../pages/Login';
import AdminDashboard from '../pages/AdminDashboard';
import CreateAnnouncement from '../pages/CreateAnnouncement';
import EditAnnouncement from '../pages/EditAnnouncement';
import AdminAnnouncements from '../pages/AdminAnnouncements';
import ChangePassword from '../pages/ChangePassword';
import AdminManagement from '../pages/AdminManagement';
import EventCalendar from '../pages/EventCalendar';
import AdminEventCalendar from '../pages/AdminEventCalendar';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <AnnouncementList />
      },
      {
        path: 'announcement/:id',
        element: <AnnouncementDetail />
      },
      {
        path: 'calendar',
        element: <EventCalendar />
      },
      {
        path: 'login',
        element: <Login />
      },
      { path: 'admin',
        element: <ProtectedRoute />,
        children: [
          { path: '',
            element: <AdminDashboard />,
            children: [
              { index: true,
                element: <CreateAnnouncement />
              },
              { path: 'create',
                element: <CreateAnnouncement />
              },
              { path: 'announcements',
                element: <AdminAnnouncements />
              },
              { path: 'edit/:id',
                element: <EditAnnouncement />
              },
              { path: 'change-password',
                element: <ChangePassword />
              },
              { path: 'admin-management',
                element: <AdminManagement />
              },
              { path: 'calendar',
                element: <AdminEventCalendar />
              }
            ]
          }
        ]
      }
    ]
  },
  // 匹配所有未匹配的路由
  {
    path: '*',
    element: <NotFound />
  }
]);
