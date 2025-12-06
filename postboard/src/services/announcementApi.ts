import axios from 'axios';
import { Announcement, AnnouncementForm } from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
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
};
