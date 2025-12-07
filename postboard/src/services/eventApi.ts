import axios from 'axios';
import { Event } from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
});

// 活动日历相关API
export const eventApi = {
  // 获取所有活动
  getAllEvents: async (): Promise<Event[]> => {
    const response = await api.get('/events');
    return response.data;
  },

  // 获取单个活动
  getEventById: async (id: string): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // 创建活动
  createEvent: async (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
    const response = await api.post('/events', event);
    return response.data;
  },

  // 更新活动
  updateEvent: async (id: string, event: Partial<Event>): Promise<Event> => {
    const response = await api.put(`/events/${id}`, event);
    return response.data;
  },

  // 删除活动
  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },
};
