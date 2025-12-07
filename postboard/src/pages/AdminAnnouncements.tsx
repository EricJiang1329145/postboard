import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAnnouncementStore } from '../context/useStore';
import dayjs from 'dayjs';

const AdminAnnouncements = () => {
  const { announcements, deleteAnnouncement, updateAnnouncement, fetchAnnouncements } = useAnnouncementStore();
  const [searchKeyword, setSearchKeyword] = useState('');

  // 页面加载时获取公告列表
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // 过滤公告并按置顶状态和创建时间排序
  const filteredAnnouncements = announcements.filter(announcement => 
    announcement.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchKeyword.toLowerCase())
  ).sort((a, b) => {
    // 先按置顶状态排序，置顶的排在前面
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // 然后按创建时间排序，最新的排在前面
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // 切换公告发布状态
  const togglePublish = (id: string, currentStatus: boolean) => {
    updateAnnouncement(id, { isPublished: !currentStatus });
  };

  // 切换公告置顶状态
  const togglePin = (id: string, currentStatus: boolean) => {
    updateAnnouncement(id, { isPinned: !currentStatus });
  };

  // 更新公告优先级
  const updatePriority = (id: string, priority: number) => {
    updateAnnouncement(id, { priority });
  };

  // 删除公告
  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这篇公告吗？')) {
      deleteAnnouncement(id);
    }
  };

  return (
    <div className="admin-announcements">
      <div className="page-title">
        <h2>公告管理</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索公告..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="announcement-list">
        {filteredAnnouncements.length === 0 ? (
          <div className="card empty-state">
            <h3>没有找到匹配的公告</h3>
            <p>请尝试调整搜索关键词</p>
          </div>
        ) : (
          filteredAnnouncements.map(announcement => (
            <div key={announcement.id} className="card fade-in">
              <div className="announcement-header">
                <div className="announcement-info">
                  <h3 className="announcement-title">
                    {announcement.title}
                    {announcement.isPinned && (
                      <span className="status-tag danger">置顶</span>
                    )}
                    {announcement.isPinned && (
                      <span className="status-tag info">优先级: {announcement.priority}</span>
                    )}
                  </h3>
                  <div className="announcement-meta">
                    <span>作者: {announcement.author}</span>
                    <span>创建时间: {dayjs(announcement.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                    <span>阅读次数: {announcement.readCount}</span>
                    {announcement.scheduledPublishAt && (
                      <span className="text-warning">定时发布: {dayjs(announcement.scheduledPublishAt).format('YYYY-MM-DD HH:mm')}</span>
                    )}
                    {announcement.isPinned && announcement.pinnedAt && (
                      <span className="text-danger">置顶时间: {dayjs(announcement.pinnedAt).format('YYYY-MM-DD HH:mm')}</span>
                    )}
                    <span 
                      className={`status-tag ${announcement.publishStatus === 'published' ? 'success' : 
                        announcement.publishStatus === 'scheduled' ? 'warning' : 'error'}`}
                    >
                      {announcement.publishStatus === 'published' ? '已发布' : 
                       announcement.publishStatus === 'scheduled' ? '待发布' : '草稿'}
                    </span>
                  </div>
                  
                  {/* 优先级调整控件 */}
                  {announcement.isPinned && (
                    <div className="form-group priority-control">
                      <label htmlFor={`priority-${announcement.id}`} className="priority-label">调整优先级:</label>
                      <select
                        id={`priority-${announcement.id}`}
                        value={announcement.priority}
                        onChange={(e) => updatePriority(announcement.id, parseInt(e.target.value, 10))}
                        className="priority-select"
                      >
                        <option value={1}>1 - 最低</option>
                        <option value={2}>2</option>
                        <option value={3}>3 - 中等</option>
                        <option value={4}>4</option>
                        <option value={5}>5 - 最高</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="button-group">
                  <button 
                    className={`btn ${announcement.isPinned ? 'btn-warning' : 'btn-secondary'}`}
                    onClick={() => togglePin(announcement.id, announcement.isPinned)}
                  >
                    {announcement.isPinned ? '取消置顶' : '置顶'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => togglePublish(announcement.id, announcement.isPublished)}
                  >
                    {announcement.isPublished ? '撤销发布' : '发布'}
                  </button>
                  <Link to={`/admin/edit/${announcement.id}`}>
                    <button className="btn btn-primary">编辑</button>
                  </Link>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
              <div className="announcement-content markdown-content" 
                dangerouslySetInnerHTML={{
                  __html: announcement.content.replace(/[#*`\[\]]/g, '').substring(0, 150) + '...'
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
