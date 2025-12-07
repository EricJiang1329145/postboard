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
  isPinned: boolean; // 是否置顶
  pinnedAt: string | null; // 置顶时间
  priority: number; // 置顶优先级（1-5，数字越大优先级越高）
  readCount: number; // 阅读次数
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

// 修改密码表单类型
export interface ChangePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 公告表单类型
export interface AnnouncementForm {
  title: string;
  content: string;
  category: string;
  author: string; // 作者名称
  isPublished: boolean;
  scheduledPublishAt: string | null; // 定时发布时间
  publishStatus: 'draft' | 'scheduled' | 'published'; // 发布状态
  isPinned?: boolean; // 是否置顶（可选）
  pinnedAt?: string | null; // 置顶时间（可选）
  priority?: number; // 置顶优先级（可选，1-5）
}

// 搜索参数类型
export interface SearchParams {
  keyword: string;
  category: string;
  sortBy: 'createdAt' | 'updatedAt';
  order: 'asc' | 'desc';
}

// 活动日历类型定义
export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string; // 开始时间，格式：YYYY-MM-DDTHH:mm:ss
  endDate: string; // 结束时间，格式：YYYY-MM-DDTHH:mm:ss
  createdAt: string;
  updatedAt: string;
}

// 活动日历表单类型
export interface EventForm {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}
