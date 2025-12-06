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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>公告管理</h2>
        <input
          type="text"
          placeholder="搜索公告..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>

      <div className="announcement-list">
        {filteredAnnouncements.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
              没有找到匹配的公告
            </p>
          </div>
        ) : (
          filteredAnnouncements.map(announcement => (
            <div key={announcement.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {announcement.title}
                    {announcement.isPinned && (
                      <span style={{ 
                        backgroundColor: '#e74c3c', 
                        color: 'white', 
                        padding: '0.125rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        置顶
                      </span>
                    )}
                    {announcement.isPinned && (
                      <span style={{ 
                        backgroundColor: '#3498db', 
                        color: 'white', 
                        padding: '0.125rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        优先级: {announcement.priority}
                      </span>
                    )}
                  </h3>
                  <div className="announcement-meta">
                    <span>作者: {announcement.author}</span>
                    <span>创建时间: {dayjs(announcement.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                    {announcement.scheduledPublishAt && (
                      <span style={{ color: '#f39c12', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                        定时发布: {dayjs(announcement.scheduledPublishAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    )}
                    {announcement.isPinned && announcement.pinnedAt && (
                      <span style={{ color: '#e74c3c', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                        置顶时间: {dayjs(announcement.pinnedAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    )}
                    <span 
                      className={
                        announcement.publishStatus === 'published' ? 'success' : 
                        announcement.publishStatus === 'scheduled' ? 'warning' : 'error'
                      } 
                      style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        backgroundColor: announcement.publishStatus === 'published' ? '#2ecc71' : 
                                          announcement.publishStatus === 'scheduled' ? '#f39c12' : '#e74c3c',
                        color: 'white'
                      }}
                    >
                      {announcement.publishStatus === 'published' ? '已发布' : 
                       announcement.publishStatus === 'scheduled' ? '待发布' : '草稿'}
                    </span>
                  </div>
                  
                  {/* 优先级调整控件 */}
                  {announcement.isPinned && (
                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>调整优先级:</label>
                      <select
                        value={announcement.priority}
                        onChange={(e) => updatePriority(announcement.id, parseInt(e.target.value, 10))}
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className={announcement.isPinned ? 'warning' : 'secondary'}
                    onClick={() => togglePin(announcement.id, announcement.isPinned)}
                  >
                    {announcement.isPinned ? '取消置顶' : '置顶'}
                  </button>
                  <button 
                    className="secondary"
                    onClick={() => togglePublish(announcement.id, announcement.isPublished)}
                  >
                    {announcement.isPublished ? '撤销发布' : '发布'}
                  </button>
                  <Link to={`/admin/edit/${announcement.id}`}>
                    <button className="primary">编辑</button>
                  </Link>
                  <button 
                    className="danger"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
              <p className="markdown-content" 
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
