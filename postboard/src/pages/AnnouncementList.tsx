import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAnnouncementStore } from '../context/useStore';
import dayjs from 'dayjs';
import { SearchParams } from '../types';

const AnnouncementList = () => {
  const { announcements, filterAnnouncements } = useAnnouncementStore();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    keyword: '',
    category: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [filteredAnnouncements, setFilteredAnnouncements] = useState(
    announcements.filter(a => a.isPublished)
  );
  const [categories, setCategories] = useState<string[]>([]);

  // 提取所有唯一分类
  useEffect(() => {
    const uniqueCategories = Array.from(
      new Set(announcements.map(a => a.category))
    );
    setCategories(uniqueCategories);
  }, [announcements]);

  // 过滤公告
  useEffect(() => {
    const filtered = filterAnnouncements(searchParams.keyword, searchParams.category);
    setFilteredAnnouncements(filtered);
  }, [searchParams, announcements, filterAnnouncements]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({ ...prev, keyword: e.target.value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(prev => ({ ...prev, category: e.target.value }));
  };

  return (
    <div className="announcement-list-page">
      <h1>学校公告</h1>
      
      {/* 搜索和筛选栏 */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索公告标题或内容..."
          value={searchParams.keyword}
          onChange={handleSearchChange}
        />
        <select
          value={searchParams.category}
          onChange={handleCategoryChange}
        >
          <option value="">所有分类</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* 公告列表 */}
      <div className="announcement-list">
        {filteredAnnouncements.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
              没有找到匹配的公告
            </p>
          </div>
        ) : (
          filteredAnnouncements.map(announcement => (
            <div key={announcement.id} className="announcement-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3>
                  <Link to={`/announcement/${announcement.id}`}>
                    {announcement.title}
                  </Link>
                </h3>
                <span className="announcement-category">
                  {announcement.category}
                </span>
              </div>
              
              <div className="announcement-meta">
                <span>作者: {announcement.author}</span>
                <span>发布时间: {dayjs(announcement.createdAt).format('YYYY-MM-DD HH:mm')}</span>
              </div>
              
              {/* 公告摘要 - 截取前200个字符 */}
              <div className="markdown-content" style={{ marginBottom: '1rem' }}>
                {announcement.content.replace(/\$[^$]+\$|\$\$[^$]+\$\$/g, '') // 移除数学公式
                  .replace(/[#*`\[\]]/g, '') // 移除其他Markdown语法
                  .substring(0, 200) + '...'}
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <Link 
                  to={`/announcement/${announcement.id}`}
                  style={{ 
                    backgroundColor: '#3498db', 
                    color: 'white', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '4px',
                    textDecoration: 'none'
                  }}
                >
                  查看详情
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementList;
