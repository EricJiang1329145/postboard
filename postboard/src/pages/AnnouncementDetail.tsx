import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAnnouncementStore } from '../context/useStore';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import dayjs from 'dayjs';

const AnnouncementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getAnnouncementById, updateAnnouncement } = useAnnouncementStore();
  const [announcement, setAnnouncement] = useState(
    getAnnouncementById(id || '')
  );
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false); // 防止重复调用的标志

  useEffect(() => {
    // 直接调用获取单个公告的 API 来增加阅读次数
    const loadAnnouncement = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/announcements/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('获取公告失败');
        }
        
        const foundAnnouncement = await response.json();
        setLoading(false);
        if (!foundAnnouncement || !foundAnnouncement.isPublished) {
          navigate('/');
        } else {
          // 更新本地 store 中的公告
          updateAnnouncement(foundAnnouncement.id, foundAnnouncement);
          setAnnouncement(foundAnnouncement);
        }
      } catch (error) {
        console.error('获取公告失败:', error);
        setLoading(false);
        navigate('/');
      }
    };

    // 只调用一次，防止 React 18 Strict Mode 导致的重复调用
    if (!hasFetched && id) {
      loadAnnouncement();
      setHasFetched(true);
    }
  }, [id, navigate, updateAnnouncement, hasFetched]); // 添加 hasFetched 到依赖项

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
            <span>上传时间: {dayjs(announcement.createdAt).format('YYYY-MM-DD HH:mm')}</span>
            {announcement.updatedAt !== announcement.createdAt && (
              <span>更新时间: {dayjs(announcement.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
            )}
            <span>阅读次数: {announcement.readCount}</span>
          </div>
          </div>
          <span className="announcement-category">
            {announcement.category}
          </span>
        </div>

        <div className="markdown-content" style={{ marginTop: '2rem' }}>
          <style jsx>{`
            .markdown-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 1rem 0;
            }
            .markdown-content th, .markdown-content td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .markdown-content th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .markdown-content tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .markdown-content tr:hover {
              background-color: #f5f5f5;
            }
            /* 图片尺寸控制 */
            .markdown-content img {
              max-width: 100%;
              height: auto;
              margin: 1rem 0;
              border-radius: 4px;
            }
          `}</style>
          <ReactMarkdown
            remarkPlugins={[
              [remarkMath as any, {
                singleDollarTextMath: true,
                doubleDollarDisplayMath: true
              }],
              remarkGfm as any
            ]}
            rehypePlugins={[
              [rehypeKatex as any, {
                strict: false,
                throwOnError: false,
                trust: true
              }],
              rehypeRaw as any
            ]}
            dangerouslySetInnerHTML={false}
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
