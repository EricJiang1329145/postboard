import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import MDEditor from '@uiw/react-md-editor';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAnnouncementStore } from '../context/useStore';
import { AnnouncementForm } from '../types';
import MarkdownUploader from '../components/MarkdownUploader';

const EditAnnouncement = () => {
  const { id } = useParams<{ id: string }>();
  const { getAnnouncementById, updateAnnouncement } = useAnnouncementStore();
  const [preview, setPreview] = useState(false);
  const navigate = useNavigate();
  
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
      publishStatus: 'draft'
    }
  });

  const scheduledPublishAt = watch('scheduledPublishAt');

  const content = watch('content');

  // 加载公告数据
  useEffect(() => {
    const announcement = getAnnouncementById(id || '');
    if (announcement) {
      setValue('title', announcement.title);
      setValue('content', announcement.content);
      setValue('category', announcement.category);
      setValue('isPublished', announcement.isPublished);
    } else {
      navigate('/admin/announcements');
    }
  }, [id, getAnnouncementById, navigate, setValue]);

  const onSubmit = (data: AnnouncementForm) => {
    if (id) {
      updateAnnouncement(id, data);
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
            <button
              type="button"
              className="secondary"
              onClick={() => setPreview(!preview)}
              style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
            >
              {preview ? '编辑模式' : '预览模式'}
            </button>
          </div>
          
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
            {preview ? (
              <div 
                className="markdown-content"
                style={{ padding: '1rem', backgroundColor: '#fafafa', minHeight: '400px' }}
              >
                <MDEditor.Markdown 
                  source={content || '# 请输入内容'} 
                  remarkPlugins={[remarkMath]} 
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
                  remarkPlugins: [remarkMath],
                  rehypePlugins: [rehypeKatex],
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
