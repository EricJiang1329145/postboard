import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAnnouncementStore } from '../context/useStore';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import dayjs from 'dayjs';

const AnnouncementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getAnnouncementById, fetchAnnouncements } = useAnnouncementStore();
  const [announcement, setAnnouncement] = useState(
    getAnnouncementById(id || '')
  );
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 先获取最新的公告列表
    const loadAnnouncement = async () => {
      await fetchAnnouncements();
      const foundAnnouncement = getAnnouncementById(id || '');
      setLoading(false);
      if (!foundAnnouncement || !foundAnnouncement.isPublished) {
        navigate('/');
      } else {
        setAnnouncement(foundAnnouncement);
      }
    };

    loadAnnouncement();
  }, [id, getAnnouncementById, navigate, fetchAnnouncements]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!announcement) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="announcement-detail">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h1>{announcement.title}</h1>
            <div className="announcement-meta" style={{ marginTop: '0.5rem' }}>
              <span>作者: {announcement.author}</span>
              <span>发布时间: {dayjs(announcement.createdAt).format('YYYY-MM-DD HH:mm')}</span>
              {announcement.updatedAt !== announcement.createdAt && (
                <span>更新时间: {dayjs(announcement.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
              )}
            </div>
          </div>
          <span className="announcement-category">
            {announcement.category}
          </span>
        </div>

        <div className="markdown-content" style={{ marginTop: '2rem' }}>
          <ReactMarkdown
            remarkPlugins={[
              [remarkMath as any, {
                singleDollarTextMath: true,
                doubleDollarDisplayMath: true
              }]
            ]}
            rehypePlugins={[
              [rehypeKatex as any, {
                strict: false,
                throwOnError: false,
                trust: true
              }]
            ]}
          >
            {announcement.content}
          </ReactMarkdown>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          <Link 
            to="/"
            style={{ 
              backgroundColor: '#3498db', 
              color: 'white', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '4px',
              textDecoration: 'none'
            }}
          >
            返回公告列表
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetail;
