import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import MDEditor from '@uiw/react-md-editor';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAnnouncementStore, useUserStore } from '../context/useStore';
import { AnnouncementForm } from '../types';
import MarkdownUploader from '../components/MarkdownUploader';

const CreateAnnouncement = () => {
  const { addAnnouncement } = useAnnouncementStore();
  const { currentUser } = useUserStore();
  const [preview, setPreview] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
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

  const onSubmit = (data: AnnouncementForm) => {
    const { pinnedAt, ...restData } = data;
    addAnnouncement({
      ...restData,
      author: currentUser?.username || '管理员',
      isPinned: restData.isPinned || false,
      priority: restData.priority || 1,
      pinnedAt: null // 由store内部根据isPinned值处理实际的置顶时间
    });
    navigate('/admin/announcements');
  };

  return (
    <div className="create-announcement">
      <h2>创建公告</h2>
      
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
            保存公告
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

export default CreateAnnouncement;
