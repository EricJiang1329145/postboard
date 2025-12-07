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

        <div className="markdown-content" style={{ 
          marginTop: '2rem',
          fontSize: '1rem',
          lineHeight: '1.8',
          color: '#333'
        }}>
          {/* 使用ReactMarkdown渲染Markdown内容 */}
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
            components={{
              // 自定义表格样式
              table: ({ children, ...props }) => (
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  margin: '1rem 0'
                }} {...props}>
                  {children}
                </table>
              ),
              th: ({ children, ...props }) => (
                <th style={{
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'left',
                  backgroundColor: '#f2f2f2',
                  fontWeight: 'bold'
                }} {...props}>
                  {children}
                </th>
              ),
              td: ({ children, ...props }) => (
                <td style={{
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'left'
                }} {...props}>
                  {children}
                </td>
              ),
              // 简化的表格行样式，React内联样式不支持伪类选择器
              tr: ({ children, ...props }) => (
                <tr style={{
                  borderBottom: '1px solid #eee'
                }} {...props}>
                  {children}
                </tr>
              ),
              // 自定义图片样式
              img: ({ ...props }) => (
                <img
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    margin: '1rem 0',
                    borderRadius: '4px'
                  }}
                  {...props}
                />
              )
            }}
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
