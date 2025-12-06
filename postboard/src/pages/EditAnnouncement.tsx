import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import MDEditor from '@uiw/react-md-editor';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAnnouncementStore } from '../context/useStore';
import { AnnouncementForm } from '../types';
import MarkdownUploader from '../components/MarkdownUploader';
import { uploadImage } from '../services/imageUpload';

const EditAnnouncement = () => {
  const { id } = useParams<{ id: string }>();
  const { getAnnouncementById, updateAnnouncement } = useAnnouncementStore();
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<AnnouncementForm>({
    defaultValues: {
      title: '',
      content: '',
      category: '学校通知',
      isPublished: false,
      scheduledPublishAt: null,
      publishStatus: 'draft',
      isPinned: false,
      priority: 3 // 默认优先级
    }
  });

  const scheduledPublishAt = watch('scheduledPublishAt');

  const content = watch('content');

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setUploadMessage('');
    
    try {
      const url = await uploadImage(file);
      // 将图片插入到编辑器中
      const newContent = `${content || ''}\n![${file.name}](${url})\n`;
      setValue('content', newContent);
      setUploadMessage('图片上传成功！');
      setTimeout(() => setUploadMessage(''), 2000);
    } catch (error) {
      setUploadMessage(`上传失败：${error instanceof Error ? error.message : '未知错误'}`);
      setTimeout(() => setUploadMessage(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  // 加载公告数据
  useEffect(() => {
    const announcement = getAnnouncementById(id || '');
    if (announcement) {
      setValue('title', announcement.title);
      setValue('content', announcement.content);
      setValue('category', announcement.category);
      setValue('isPublished', announcement.isPublished);
      setValue('isPinned', announcement.isPinned);
      setValue('priority', announcement.priority);
    } else {
      navigate('/admin/announcements');
    }
  }, [id, getAnnouncementById, navigate, setValue]);

  const onSubmit = (data: AnnouncementForm) => {
    if (id) {
      updateAnnouncement(id, {
        ...data,
        isPinned: data.isPinned || false,
        priority: data.priority || 1
      });
      navigate('/admin/announcements');
    }
  };

  return (
    <div className="edit-announcement">
      <h2>编辑公告</h2>
      
      <form onSubmit={handleSubmit(onSubmit as any)}>
        <div className="form-group">
          <label htmlFor="title">标题</label>
          <input
            id="title"
            type="text"
            {...register('title')}
          />
          {errors.title && <div className="error">{errors.title.message}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="category">分类</label>
          <select
            id="category"
            {...register('category')}
          >
            <option value="学校通知">学校通知</option>
            <option value="系统通知">系统通知</option>
            <option value="活动公告">活动公告</option>
            <option value="其他">其他</option>
          </select>
          {errors.category && <div className="error">{errors.category.message}</div>}
        </div>
        
        {/* Markdown文件上传组件 */}
        <div className="form-group">
          <h3>上传Markdown文件</h3>
          <MarkdownUploader 
            onFileRead={(fileContent) => {
              setValue('content', fileContent);
            }}
          />
        </div>
        
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label htmlFor="content">内容</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* 独立的图片上传按钮 */}
              <label
                htmlFor="image-upload"
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                🖼️ 上传图片
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                    // 重置文件输入，以便可以重复上传同一文件
                    e.target.value = '';
                  }}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                type="button"
                className="secondary"
                onClick={() => setPreview(!preview)}
                style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
              >
                {preview ? '编辑模式' : '预览模式'}
              </button>
            </div>
          </div>
          
          {/* 操作指引 */}
          <div style={{
            backgroundColor: '#e8f4f8',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '0.75rem',
            fontSize: '0.875rem',
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            💡 <span>提示：您可以通过以下方式上传图片：</span>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>点击上方的🖼️ 上传图片按钮</li>
              <li>直接将图片拖拽到编辑器中</li>
              <li>在编辑器工具栏中点击图片图标</li>
            </ul>
          </div>
          
          {/* 上传状态反馈 */}
          {uploadMessage && (
            <div style={{
              padding: '0.5rem',
              borderRadius: '4px',
              marginBottom: '0.75rem',
              fontSize: '0.875rem',
              backgroundColor: uploading ? '#fff3cd' : '#d4edda',
              color: uploading ? '#856404' : '#155724',
              border: `1px solid ${uploading ? '#ffeeba' : '#c3e6cb'}`
            }}>
              {uploading ? '⏳ 上传中...' : ''} {uploadMessage}
            </div>
          )}
          
          {/* 拖拽上传区域 */}
          <div
            ref={editorRef}
            style={{
              border: '1px dashed #3498db',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (editorRef.current) {
                editorRef.current.style.borderColor = '#2980b9';
                editorRef.current.style.backgroundColor = 'rgba(52, 152, 219, 0.05)';
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (editorRef.current) {
                editorRef.current.style.borderColor = '#3498db';
                editorRef.current.style.backgroundColor = 'transparent';
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (editorRef.current) {
                editorRef.current.style.borderColor = '#3498db';
                editorRef.current.style.backgroundColor = 'transparent';
              }
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) {
                handleImageUpload(file);
              }
            }}
          >
            {preview ? (
              <div 
                className="markdown-content"
                style={{ padding: '1rem', backgroundColor: '#fafafa', minHeight: '400px' }}
              >
                <MDEditor.Markdown 
                  source={content || '# 请输入内容'} 
                  remarkPlugins={[remarkMath, remarkGfm]} 
                  rehypePlugins={[rehypeKatex]}
                />
              </div>
            ) : (
              <MDEditor
                height={400}
                value={content}
                onChange={(value) => {
                  setValue('content', value || '');
                }}
                previewOptions={{
                  remarkPlugins: [remarkMath, remarkGfm],
                  rehypePlugins: [rehypeKatex],
                }}
                onUploadImage={async (file: File) => {
                  setUploading(true);
                  setUploadMessage('');
                  try {
                    const url = await uploadImage(file);
                    setUploadMessage('图片上传成功！');
                    setTimeout(() => setUploadMessage(''), 2000);
                    return url;
                  } catch (error) {
                    setUploadMessage(`上传失败：${error instanceof Error ? error.message : '未知错误'}`);
                    setTimeout(() => setUploadMessage(''), 3000);
                    throw error;
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            )}
          </div>
          {errors.content && <div className="error">{errors.content.message}</div>}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
          {/* 立即发布选项 */}
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              id="isPublished"
              type="checkbox"
              {...register('isPublished', {
                onChange: (e) => {
                  // 如果勾选立即发布，清除定时发布时间
                  if (e.target.checked) {
                    setValue('scheduledPublishAt', null);
                  }
                }
              })}
            />
            <label htmlFor="isPublished" style={{ margin: 0 }}>立即发布</label>
          </div>
          
          {/* 定时发布选项 */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                id="useSchedule"
                type="checkbox"
                checked={!!scheduledPublishAt}
                onChange={(e) => {
                  if (e.target.checked) {
                    // 勾选定时发布，清除立即发布
                    setValue('isPublished', false);
                    // 设置默认时间为当前时间30分钟后
                    const defaultTime = new Date();
                    defaultTime.setMinutes(defaultTime.getMinutes() + 30);
                    setValue('scheduledPublishAt', defaultTime.toISOString().slice(0, 16));
                  } else {
                    // 取消定时发布
                    setValue('scheduledPublishAt', null);
                  }
                }}
              />
              <label htmlFor="useSchedule" style={{ margin: 0 }}>定时发布</label>
            </div>
            
            {scheduledPublishAt && (
              <div style={{ marginLeft: '2rem' }}>
                <label htmlFor="scheduledPublishAt">发布时间</label>
                <input
                  id="scheduledPublishAt"
                  type="datetime-local"
                  {...register('scheduledPublishAt')}
                  style={{ marginTop: '0.25rem' }}
                  min={new Date().toISOString().slice(0, 16)} // 最小时间为当前时间
                />
              </div>
            )}
          </div>
          
          {/* 置顶选项 */}
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              id="isPinned"
              type="checkbox"
              {...register('isPinned')}
            />
            <label htmlFor="isPinned" style={{ margin: 0 }}>置顶公告</label>
          </div>
          
          {/* 优先级选择 */}
          <div className="form-group" style={{ marginLeft: '2rem' }}>
            <label htmlFor="priority" style={{ marginBottom: '0.5rem', display: 'block' }}>置顶优先级（数字越大优先级越高）</label>
            <select
              id="priority"
              {...register('priority', {
                valueAsNumber: true
              })}
            >
              <option value={1}>1 - 最低</option>
              <option value={2}>2</option>
              <option value={3} selected>3 - 中等</option>
              <option value={4}>4</option>
              <option value={5}>5 - 最高</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" className="primary">
            更新公告
          </button>
          <button 
            type="button" 
            className="secondary"
            onClick={() => navigate('/admin/announcements')}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAnnouncement;
