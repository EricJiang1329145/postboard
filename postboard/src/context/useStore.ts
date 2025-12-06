import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Announcement, User } from '../types';
import dayjs from 'dayjs';

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
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (username: string, password: string, role: 'admin' | 'user') => void;
}

// 初始化默认数据
const initialAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '欢迎使用学校公告栏系统',
    content: '# 欢迎使用\n\n这是一个学校公告栏系统，用于发布和管理学校公告。\n\n## 功能特点\n\n- 支持Markdown格式\n- 响应式设计\n- 分类管理\n- 搜索功能\n\n请遵守公告发布规范，文明发言。',
    category: '系统通知',
    author: '管理员',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
    isPublished: true,
    scheduledPublishAt: null,
    publishStatus: 'published'
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
    publishStatus: 'published'
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

export const useAnnouncementStore = create<AnnouncementStore & { checkScheduledAnnouncements: () => void }>()(
  persist(
    (set, get) => ({
      announcements: initialAnnouncements,
      
      addAnnouncement: (announcement) => {
        // 确定发布状态
        let publishStatus: 'draft' | 'scheduled' | 'published' = 'draft';
        let isPublished = false;
        
        if (announcement.isPublished) {
          publishStatus = 'published';
          isPublished = true;
        } else if (announcement.scheduledPublishAt) {
          publishStatus = 'scheduled';
          isPublished = false;
        }
        
        const newAnnouncement: Announcement = {
          ...announcement,
          id: generateId(),
          createdAt: dayjs().toISOString(),
          updatedAt: dayjs().toISOString(),
          isPublished,
          publishStatus
        };
        
        const updatedAnnouncements = [newAnnouncement, ...get().announcements];
        // 检查并发布到期的定时公告
        const finalAnnouncements = checkScheduledAnnouncements(updatedAnnouncements);
        
        set({ announcements: finalAnnouncements });
      },
      
      updateAnnouncement: (id, updates) => {
        const updatedAnnouncements = get().announcements.map((announcement) => {
          if (announcement.id === id) {
            // 确定发布状态
            let publishStatus: 'draft' | 'scheduled' | 'published' = announcement.publishStatus;
            let isPublished = announcement.isPublished;
            
            if (updates.isPublished !== undefined) {
              if (updates.isPublished) {
                publishStatus = 'published';
                isPublished = true;
              } else if (updates.scheduledPublishAt) {
                publishStatus = 'scheduled';
                isPublished = false;
              } else {
                publishStatus = 'draft';
                isPublished = false;
              }
            } else if (updates.scheduledPublishAt) {
              publishStatus = 'scheduled';
              isPublished = false;
            }
            
            return {
              ...announcement,
              ...updates,
              isPublished,
              publishStatus,
              updatedAt: dayjs().toISOString()
            };
          }
          return announcement;
        });
        
        // 检查并发布到期的定时公告
        const finalAnnouncements = checkScheduledAnnouncements(updatedAnnouncements);
        
        set({ announcements: finalAnnouncements });
      },
      
      deleteAnnouncement: (id) => {
        set((state) => ({
          announcements: state.announcements.filter((announcement) => announcement.id !== id)
        }));
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
    }),
    {
      name: 'announcement-storage',
    }
  )
);

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: initialUsers,
      
      login: (username, password) => {
        const user = get().users.find(
          (user) => user.username === username && user.password === password
        );
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ currentUser: null });
      },
      
      register: (username, password, role) => {
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
      name: 'user-storage',
    }
  )
);
