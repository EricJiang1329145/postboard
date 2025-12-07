import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Announcement, User, Event } from '../types';
import dayjs from 'dayjs';
import { announcementApi, userApi, eventApi } from '../services/announcementApi';

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

interface AnnouncementStore {
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  getAnnouncementById: (id: string) => Announcement | undefined;
  filterAnnouncements: (keyword: string, category: string) => Announcement[];
}

interface UserStore {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string, role: 'admin' | 'user') => void;
}

// 初始化默认数据
const initialAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '欢迎使用学校公告栏系统',
    content: '# 欢迎使用\n\n这是一个学校公告栏系统，用于发布和管理学校公告。\n\n## 功能特点\n\n- 支持Markdown格式\n- 响应式设计\n- 分类管理\n- 搜索功能\n- 置顶功能\n- 优先级管理\n\n请遵守公告发布规范，文明发言。',
    category: '系统通知',
    author: '管理员',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
    isPublished: true,
    scheduledPublishAt: null,
    publishStatus: 'published',
    isPinned: true,
    pinnedAt: dayjs().subtract(1, 'day').toISOString(),
    priority: 5, // 最高优先级
    readCount: 0 // 阅读次数
  },
  {
    id: '2',
    title: '2024年春季学期开学通知',
    content: '# 2024年春季学期开学通知\n\n各位同学：\n\n根据学校安排，2024年春季学期将于2月20日正式开学，请大家提前做好准备。\n\n## 报到时间\n\n- 本科生：2月19日\n- 研究生：2月20日\n\n## 注意事项\n\n1. 请携带学生证和身份证\n2. 检查宿舍水电情况\n3. 按时参加开学典礼\n\n祝大家新学期愉快！',
    category: '学校通知',
    author: '教务处',
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    updatedAt: dayjs().subtract(2, 'day').toISOString(),
    isPublished: true,
    scheduledPublishAt: null,
    publishStatus: 'published',
    isPinned: false,
    pinnedAt: null,
    priority: 1, // 默认优先级
    readCount: 0 // 阅读次数
  }
];

const initialUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123', // 实际项目中应使用加密存储
    role: 'admin',
    createdAt: dayjs().toISOString()
  }
];

// 检查并发布到期的定时公告
const checkScheduledAnnouncements = (announcements: Announcement[]): Announcement[] => {
  const now = dayjs().toISOString();
  const updatedAnnouncements: Announcement[] = announcements.map(announcement => {
    // 如果公告是待发布状态且当前时间已超过或等于定时发布时间
    if (announcement.publishStatus === 'scheduled' && announcement.scheduledPublishAt) {
      if (now >= announcement.scheduledPublishAt) {
        return {
          ...announcement,
          isPublished: true,
          publishStatus: 'published' as const,
          updatedAt: now
        };
      }
    }
    return announcement;
  });
  return updatedAnnouncements;
};

export const useAnnouncementStore = create<AnnouncementStore & {
  checkScheduledAnnouncements: () => void;
  fetchAnnouncements: () => Promise<void>;
}>()(
  (set, get) => ({
    announcements: initialAnnouncements,
    
    // 获取公告列表
    fetchAnnouncements: async () => {
      try {
        const announcements = await announcementApi.getAllAnnouncementsForAdmin();
        set({ announcements });
      } catch (error) {
        console.error('获取公告列表失败:', error);
      }
    },
    
    addAnnouncement: async (announcement) => {
      try {
        const newAnnouncement = await announcementApi.createAnnouncement(announcement);
        set((state) => ({
          announcements: [newAnnouncement, ...state.announcements]
        }));
      } catch (error) {
        console.error('添加公告失败:', error);
      }
    },
    
    updateAnnouncement: async (id, updates) => {
      try {
        const updatedAnnouncement = await announcementApi.updateAnnouncement(id, updates);
        set((state) => ({
          announcements: state.announcements.map((announcement) => 
            announcement.id === id ? updatedAnnouncement : announcement
          )
        }));
      } catch (error) {
        console.error('更新公告失败:', error);
      }
    },
    
    deleteAnnouncement: async (id) => {
      try {
        await announcementApi.deleteAnnouncement(id);
        set((state) => ({
          announcements: state.announcements.filter((announcement) => announcement.id !== id)
        }));
      } catch (error) {
        console.error('删除公告失败:', error);
      }
    },
    
    getAnnouncementById: (id) => {
      return get().announcements.find((announcement) => announcement.id === id);
    },
    
    filterAnnouncements: (keyword, category) => {
      const announcements = get().announcements;
      
      return announcements.filter((announcement) => {
        const matchesKeyword = keyword
          ? announcement.title.toLowerCase().includes(keyword.toLowerCase()) ||
            announcement.content.toLowerCase().includes(keyword.toLowerCase())
          : true;
        const matchesCategory = category ? announcement.category === category : true;
        return matchesKeyword && matchesCategory && announcement.isPublished;
      }).sort((a, b) => {
        // 先按置顶状态排序，置顶的排在前面
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // 然后按优先级排序，数字越大优先级越高
        if (a.isPinned && b.isPinned) {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
        }
        // 最后按创建时间排序，最新的排在前面
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
    
    // 手动检查并发布到期的定时公告
    checkScheduledAnnouncements: () => {
      const announcements = get().announcements;
      const updatedAnnouncements = checkScheduledAnnouncements(announcements);
      if (updatedAnnouncements !== announcements) {
        set({ announcements: updatedAnnouncements });
      }
    }
  })
);

export const useUserStore = create<UserStore & {
  login: (username: string, password: string) => Promise<boolean>;
}>()(
  persist(
    (set) => ({
      currentUser: null,
      users: initialUsers,
      
      login: async (username, password) => {
        try {
          // 使用后端API进行登录验证
          const user = await userApi.login(username, password);
          set({ currentUser: user });
          return true;
        } catch (error) {
          console.error('登录失败:', error);
          return false;
        }
      },
      
      logout: () => {
        set({ currentUser: null });
      },
      
      register: (username: string, password: string, role: 'admin' | 'user') => {
        // 实际项目中应该使用API调用
        const newUser: User = {
          id: generateId(),
          username,
          password,
          role,
          createdAt: dayjs().toISOString()
        };
        set((state) => ({
          users: [...state.users, newUser]
        }));
      }
    }),
    {
      name: 'user-storage', // localStorage 存储名称
      partialize: (state) => ({ currentUser: state.currentUser }) // 只存储 currentUser 字段
    }
  )
);

// 活动日历状态管理
interface EventStore {
  events: Event[];
  fetchEvents: () => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventById: (id: string) => Event | undefined;
}

export const useEventStore = create<EventStore>()(
  (set, get) => ({
    events: [],
    
    // 获取所有活动
    fetchEvents: async () => {
      try {
        const events = await eventApi.getAllEvents();
        set({ events });
      } catch (error) {
        console.error('获取活动列表失败:', error);
      }
    },
    
    // 添加活动
    addEvent: async (event) => {
      try {
        const newEvent = await eventApi.createEvent(event);
        set((state) => ({
          events: [...state.events, newEvent]
        }));
      } catch (error) {
        console.error('添加活动失败:', error);
      }
    },
    
    // 更新活动
    updateEvent: async (id, event) => {
      try {
        const updatedEvent = await eventApi.updateEvent(id, event as any);
        set((state) => ({
          events: state.events.map((e) => e.id === id ? updatedEvent : e)
        }));
      } catch (error) {
        console.error('更新活动失败:', error);
      }
    },
    
    // 删除活动
    deleteEvent: async (id) => {
      try {
        await eventApi.deleteEvent(id);
        set((state) => ({
          events: state.events.filter((e) => e.id !== id)
        }));
      } catch (error) {
        console.error('删除活动失败:', error);
      }
    },
    
    // 获取单个活动
    getEventById: (id) => {
      return get().events.find((event) => event.id === id);
    }
  })
);
