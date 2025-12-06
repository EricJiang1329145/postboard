import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import AnnouncementList from '../pages/AnnouncementList';
import AnnouncementDetail from '../pages/AnnouncementDetail';
import Login from '../pages/Login';
import AdminDashboard from '../pages/AdminDashboard';
import CreateAnnouncement from '../pages/CreateAnnouncement';
import EditAnnouncement from '../pages/EditAnnouncement';
import AdminAnnouncements from '../pages/AdminAnnouncements';
import ProtectedRoute from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
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
        path: 'login',
        element: <Login />
      },
      {
        path: 'admin',
        element: <ProtectedRoute />,
        children: [
          {
            path: '',
            element: <AdminDashboard />,
            children: [
              {
                index: true,
                element: <CreateAnnouncement />
              },
              {
                path: 'create',
                element: <CreateAnnouncement />
              },
              {
                path: 'announcements',
                element: <AdminAnnouncements />
              },
              {
                path: 'edit/:id',
                element: <EditAnnouncement />
              }
            ]
          }
        ]
      }
    ]
  }
]);
