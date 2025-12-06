// 公告类型定义
export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  scheduledPublishAt: string | null; // 定时发布时间
  publishStatus: 'draft' | 'scheduled' | 'published'; // 发布状态：草稿、待发布、已发布
}

// 用户类型定义
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
}

// 登录表单类型
export interface LoginForm {
  username: string;
  password: string;
}

// 公告表单类型
export interface AnnouncementForm {
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  scheduledPublishAt: string | null; // 定时发布时间
  publishStatus: 'draft' | 'scheduled' | 'published'; // 发布状态
}

// 搜索参数类型
export interface SearchParams {
  keyword: string;
  category: string;
  sortBy: 'createdAt' | 'updatedAt';
  order: 'asc' | 'desc';
}
