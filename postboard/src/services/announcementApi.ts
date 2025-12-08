import axios from 'axios';
import { Announcement } from '../types';

// 创建axios实例
const api = axios.create({
  // 使用Vite的import.meta.env或默认值
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// 公告相关API
export const announcementApi = {
  // 获取所有公告
  getAllAnnouncements: async (): Promise<Announcement[]> => {
    const response = await api.get('/announcements');
    return response.data;
  },

  // 获取单个公告
  getAnnouncementById: async (id: string): Promise<Announcement> => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  // 创建公告
  createAnnouncement: async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> => {
    const response = await api.post('/announcements', announcement);
    return response.data;
  },

  // 更新公告
  updateAnnouncement: async (id: string, announcement: Partial<Announcement>): Promise<Announcement> => {
    const response = await api.put(`/announcements/${id}`, announcement);
    return response.data;
  },

  // 删除公告
  deleteAnnouncement: async (id: string): Promise<void> => {
    await api.delete(`/announcements/${id}`);
  },

  // 获取所有分类
  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/categories');
    return response.data;
  },

  // 获取所有公告（管理员）
  getAllAnnouncementsForAdmin: async (): Promise<Announcement[]> => {
    const response = await api.get('/admin/announcements');
    return response.data;
  },
};

// 用户相关API
export const userApi = {
  // 登录
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  
  // 获取当前用户
  getCurrentUser: async () => {
    // 实际项目中应该使用认证令牌来获取当前用户
    return null;
  },
  
  // 修改密码
  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  }
};

// 管理员管理相关API
export const adminApi = {
  // 获取所有管理员
  getAllAdmins: async () => {
    const response = await api.get('/admins');
    return response.data;
  },
  
  // 新增管理员
  createAdmin: async (username: string, password: string, currentUser: string) => {
    const response = await api.post('/admins', { username, password, currentUser });
    return response.data;
  },
  
  // 修改管理员密码
  updateAdminPassword: async (id: string, newPassword: string, currentUser: string) => {
    const response = await api.put(`/admins/${id}/password`, { newPassword, currentUser });
    return response.data;
  },
  
  // 删除管理员
  deleteAdmin: async (id: string, currentUser: string) => {
    const response = await api.delete(`/admins/${id}`, { data: { currentUser } });
    return response.data;
  }
};

// 活动日历相关API
export const eventApi = {
  // 获取所有活动
  getAllEvents: async () => {
    console.log('Calling API: GET /events');
    const response = await api.get('/api/events');
    console.log('API response:', response.data);
    return response.data;
  },
  
  // 获取单个活动
  getEventById: async (id: string) => {
    const response = await api.get(`/api/events/${id}`);
    return response.data;
  },
  
  // 创建活动
  createEvent: async (event: { title: string; description: string; startDate: string; endDate: string }) => {
    console.log('Calling API: POST /events with data:', event);
    const response = await api.post('/api/events', event);
    console.log('API response:', response.data);
    return response.data;
  },
  
  // 更新活动
  updateEvent: async (id: string, event: { title: string; description: string; startDate: string; endDate: string }) => {
    const response = await api.put(`/api/events/${id}`, event);
    return response.data;
  },
  
  // 删除活动
  deleteEvent: async (id: string) => {
    const response = await api.delete(`/api/events/${id}`);
    return response.data;
  }
};
