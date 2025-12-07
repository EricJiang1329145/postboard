import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import MDEditor from '@uiw/react-md-editor';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { useAnnouncementStore } from '../context/useStore';
import { AnnouncementForm } from '../types';
import MarkdownUploader from '../components/MarkdownUploader';
import ImageUploader from '../components/ImageUploader';
import { uploadImage } from '../services/imageUpload';
import { debounce } from '../utils/commonUtils';

const EditAnnouncement = () => {
  const { id } = useParams<{ id: string }>();
  const { getAnnouncementById, updateAnnouncement } = useAnnouncementStore();
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveMessage, setAutoSaveMessage] = useState('');
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);

  // 表单验证规则 - 精确匹配AnnouncementForm类型
  const announcementSchema = yup.object<AnnouncementForm>().shape({
    title: yup.string()
      .required('标题不能为空')
      .min(2, '标题长度不能少于2个字符')
      .max(100, '标题长度不能超过100个字符'),
    content: yup.string()
      .required('内容不能为空')
      .min(10, '内容长度不能少于10个字符'),
    category: yup.string()
      .required('分类不能为空'),
    author: yup.string()
      .required('作者不能为空')
      .min(2, '作者名称长度不能少于2个字符')
      .max(50, '作者名称长度不能超过50个字符'),
    isPublished: yup.boolean().optional(),
    scheduledPublishAt: yup.string().nullable().optional(),
    publishStatus: yup.string()
      .oneOf(['draft', 'published', 'scheduled'], '发布状态无效')
      .optional(),
    isPinned: yup.boolean().optional(),
    priority: yup.number()
      .min(1, '优先级不能小于1')
      .max(5, '优先级不能大于5')
      .optional()
      .default(3),
    pinnedAt: yup.string().nullable().optional()
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<AnnouncementForm>({
    resolver: yupResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      category: '学校通知',
      author: '',
      isPublished: false,
      scheduledPublishAt: null,
      publishStatus: 'draft',
      isPinned: false,
      priority: 3,
      pinnedAt: null
    }
  });

  const scheduledPublishAt = watch('scheduledPublishAt');

  const content = watch('content');
  
  // 自动保存函数
  const autoSave = debounce(async (data: AnnouncementForm) => {
    if (id && (data.title.trim() || data.content.trim())) {
      try {
        // 只保存为草稿，不改变发布状态
        await updateAnnouncement(id, {
          ...data,
          isPinned: data.isPinned || false,
          priority: data.priority || 1,
          publishStatus: 'draft' // 确保自动保存只保存为草稿
        });
        setAutoSaveMessage('自动保存成功');
        setTimeout(() => setAutoSaveMessage(''), 2000);
      } catch (error) {
        console.error('自动保存失败:', error);
        setAutoSaveMessage('自动保存失败');
        setTimeout(() => setAutoSaveMessage(''), 2000);
      }
    }
  }, 3000); // 3秒防抖

  // 监听表单内容变化，触发自动保存
  useEffect(() => {
    const formData = {
      title: watch('title'),
      content: content,
      category: watch('category'),
      author: watch('author'),
      isPublished: watch('isPublished'),
      scheduledPublishAt: watch('scheduledPublishAt'),
      publishStatus: watch('publishStatus'),
      isPinned: watch('isPinned'),
      priority: watch('priority')
    };
    
    // 只有在编辑模式下才自动保存
    if (!preview) {
      autoSave(formData);
    }
  }, [content, watch, preview, id]);
  
  // 处理图片上传完成后的回调
  const handleImageUploadComplete = (imgTag: string) => {
    // 将图片插入到编辑器中
    const newContent = `${content || ''}\n${imgTag}\n`;
    setValue('content', newContent);
  };

  // 加载公告数据
  useEffect(() => {
    const announcement = getAnnouncementById(id || '');
    if (announcement) {
      setValue('title', announcement.title);
      setValue('content', announcement.content);
      setValue('category', announcement.category);
      setValue('author', announcement.author); // 设置作者名称
      setValue('isPublished', announcement.isPublished);
      setValue('isPinned', announcement.isPinned);
      setValue('priority', announcement.priority);
    } else {
      navigate('/admin/announcements');
    }
  }, [id, getAnnouncementById, navigate, setValue]);

  const onSubmit = async (data: AnnouncementForm) => {
    if (id) {
      setSubmitting(true);
      try {
        await updateAnnouncement(id, {
          ...data,
          isPinned: data.isPinned || false,
          priority: data.priority || 1
        });
        navigate('/admin/announcements');
      } catch (error) {
        console.error('更新公告失败:', error);
        setUploadMessage(`更新公告失败：${error instanceof Error ? error.message : '未知错误'}`);
        setTimeout(() => setUploadMessage(''), 3000);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="admin-announcements edit-announcement fade-in">
      <div className="page-title">
        <h2>编辑公告</h2>
      </div>
      
      {/* 自动保存状态显示 */}
      {autoSaveMessage && (
        <div className="card success-message">
          💾 {autoSaveMessage}
        </div>
      )}
      
      {/* 上传消息显示 */}
      {uploadMessage && (
        <div className={`card ${uploadMessage.includes('失败') ? 'error-message' : 'success-message'}`}>
          {uploadMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit<AnnouncementForm>(onSubmit)} className="card fade-in">
        <div className="form-group">
          <label htmlFor="title" id="title-label">标题</label>
          <input
            id="title"
            type="text"
            aria-required="true"
            aria-describedby={errors.title ? 'title-error' : undefined}
            {...register('title')}
            className="form-input"
          />
          {errors.title && <div id="title-error" className="error-message" aria-live="polite">{errors.title.message}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="category" id="category-label">分类</label>
          <select
            id="category"
            aria-required="true"
            aria-describedby={errors.category ? 'category-error' : undefined}
            {...register('category')}
            className="form-input"
          >
            <option value="学校通知">学校通知</option>
            <option value="系统通知">系统通知</option>
            <option value="活动公告">活动公告</option>
            <option value="其他">其他</option>
          </select>
          {errors.category && <div id="category-error" className="error-message" aria-live="polite">{errors.category.message}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="author" id="author-label">作者</label>
          <input
            id="author"
            type="text"
            placeholder="请输入作者名称"
            aria-required="true"
            aria-describedby={errors.author ? 'author-error' : undefined}
            {...register('author')}
            className="form-input"
          />
          {errors.author && <div id="author-error" className="error-message" aria-live="polite">{errors.author.message}</div>}
        </div>
        
        {/* Markdown文件上传组件 */}
          <div className="form-group">
            <h3 id="markdown-upload-heading">上传Markdown文件</h3>
            <MarkdownUploader 
              onFileRead={(fileContent) => {
                setValue('content', fileContent);
              }}
            />
          </div>
          
          <div className="form-group">
            <div className="flex justify-between items-center mb-3">
              <label htmlFor="content" id="content-label">内容</label>
              <div className="flex gap-2">
                {/* 使用新创建的ImageUploader组件 */}
                <ImageUploader 
                  onImageUpload={handleImageUploadComplete}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPreview(!preview)}
                  disabled={submitting}
                  aria-pressed={preview}
                >
                  {preview ? '编辑模式' : '预览模式'}
                </button>
              </div>
            </div>
          
          {/* 操作指引 */}
          <div className="bg-blue-50 p-3 rounded-md mb-3 text-sm text-gray-700 flex items-start gap-2">
            💡 <div>
              <span>提示：您可以通过以下方式上传图片：</span>
              <ul className="mt-1 ml-5 list-disc space-y-1">
                <li>点击上方的🖼️ 上传图片按钮</li>
                <li>直接将图片拖拽到编辑器中</li>
                <li>在编辑器工具栏中点击图片图标</li>
              </ul>
            </div>
          </div>
          
          {/* 拖拽上传进度显示 */}
          {uploading && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>上传进度:</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* 拖拽上传区域 */}
          <div
            ref={editorRef}
            aria-label="内容编辑器"
            aria-describedby="content-label"
            className="border-2 border-dashed border-blue-500 rounded-lg overflow-hidden relative transition-all duration-300 ease"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (editorRef.current) {
                editorRef.current.classList.remove('border-blue-500');
                editorRef.current.classList.add('border-blue-700', 'bg-blue-50');
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (editorRef.current) {
                editorRef.current.classList.remove('border-blue-700', 'bg-blue-50');
                editorRef.current.classList.add('border-blue-500');
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (editorRef.current) {
                editorRef.current.classList.remove('border-blue-700', 'bg-blue-50');
                editorRef.current.classList.add('border-blue-500');
              }
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) {
                // 直接使用ImageUploader组件的processImageUpload逻辑
                setUploading(true);
                setUploadMessage('');
                setUploadProgress(0);
                
                const img = new Image();
                img.onload = async () => {
                  try {
                    const url = await uploadImage(file, (progress) => {
                      setUploadProgress(progress);
                    });
                    
                    // 可配置的默认宽高参数
                    const defaultWidth = 500; // 默认宽度
                    const defaultHeight = 300; // 默认高度
                    
                    // 计算保持原始比例的宽高
                    let width = defaultWidth;
                    let height = defaultHeight;
                    const aspectRatio = img.width / img.height;
                    
                    // 如果原始图片更宽，以宽度为主
                    if (img.width > img.height) {
                      width = defaultWidth;
                      height = Math.round(defaultWidth / aspectRatio);
                    } else {
                      // 如果原始图片更高，以高度为主
                      height = defaultHeight;
                      width = Math.round(defaultHeight * aspectRatio);
                    }
                    
                    // 释放URL对象
                    URL.revokeObjectURL(img.src);
                    
                    // 返回HTML img标签
                    const imgTag = `<img src="${url}" width="${width}" height="${height}" alt="${file.name}">`;
                    
                    // 将图片插入到编辑器中
                    const newContent = `${content || ''}\n${imgTag}\n`;
                    setValue('content', newContent);
                    setUploadMessage('图片上传成功！');
                    setTimeout(() => setUploadMessage(''), 2000);
                  } catch (error) {
                    setUploadMessage(`上传失败：${error instanceof Error ? error.message : '未知错误'}`);
                    setTimeout(() => setUploadMessage(''), 3000);
                  } finally {
                    setUploading(false);
                    setUploadProgress(0);
                  }
                };
                img.src = URL.createObjectURL(file);
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
                  rehypePlugins={[rehypeKatex, rehypeRaw]}
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
                />
            )}
          </div>
          {errors.content && <div id="content-error" className="error-message" aria-live="polite">{errors.content.message}</div>}
        </div>
        
        <div className="form-group space-y-4 mb-4">
          {/* 立即发布选项 */}
          <div className="form-group flex items-center gap-3">
            <input
              id="isPublished"
              type="checkbox"
              aria-describedby={errors.isPublished ? 'isPublished-error' : undefined}
              {...register('isPublished', {
                onChange: (e) => {
                  // 如果勾选立即发布，清除定时发布时间
                  if (e.target.checked) {
                    setValue('scheduledPublishAt', null);
                  }
                }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-gray-700 cursor-pointer">立即发布</label>
            {errors.isPublished && <div id="isPublished-error" className="error-message" aria-live="polite">{errors.isPublished.message}</div>}
          </div>
          
          {/* 定时发布选项 */}
          <div className="form-group">
            <div className="flex items-center gap-3 mb-2">
              <input
                id="useSchedule"
                type="checkbox"
                checked={!!scheduledPublishAt}
                aria-describedby={errors.scheduledPublishAt ? 'scheduledPublishAt-error' : undefined}
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
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useSchedule" className="text-sm font-medium text-gray-700 cursor-pointer">定时发布</label>
            </div>
            
            {scheduledPublishAt && (
              <div className="ml-7">
                <label htmlFor="scheduledPublishAt" id="scheduledPublishAt-label" className="block text-sm font-medium text-gray-700 mb-1">发布时间</label>
                <input
                  id="scheduledPublishAt"
                  type="datetime-local"
                  aria-describedby={errors.scheduledPublishAt ? 'scheduledPublishAt-error' : undefined}
                  {...register('scheduledPublishAt')}
                  className="form-input"
                  min={new Date().toISOString().slice(0, 16)} // 最小时间为当前时间
                />
                {errors.scheduledPublishAt && <div id="scheduledPublishAt-error" className="error-message" aria-live="polite">{errors.scheduledPublishAt.message}</div>}
              </div>
            )}
          </div>
          
          {/* 置顶选项 */}
          <div className="form-group flex items-center gap-3">
            <input
              id="isPinned"
              type="checkbox"
              aria-describedby={errors.isPinned ? 'isPinned-error' : undefined}
              {...register('isPinned')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPinned" className="text-sm font-medium text-gray-700 cursor-pointer">置顶公告</label>
            {errors.isPinned && <div id="isPinned-error" className="error-message" aria-live="polite">{errors.isPinned.message}</div>}
          </div>
          
          {/* 优先级选择 */}
          <div className="form-group ml-7">
            <label htmlFor="priority" id="priority-label" className="block text-sm font-medium text-gray-700 mb-1">置顶优先级（数字越大优先级越高）</label>
            <select
              id="priority"
              aria-describedby={errors.priority ? 'priority-error' : undefined}
              {...register('priority', {
                valueAsNumber: true
              })}
              className="form-input"
            >
              <option value={1}>1 - 最低</option>
              <option value={2}>2</option>
              <option value={3} selected>3 - 中等</option>
              <option value={4}>4</option>
              <option value={5}>5 - 最高</option>
            </select>
            {errors.priority && <div id="priority-error" className="error-message" aria-live="polite">{errors.priority.message}</div>}
          </div>
        </div>
        
        <div className="button-group mt-4">
          <button type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
            {submitting ? '更新中...' : '更新公告'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/announcements')}
            disabled={submitting}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAnnouncement;
