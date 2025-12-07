import { useState } from 'react';
import { processImageUpload } from '../utils/imageUtils';

interface ImageUploaderProps {
  onImageUpload: (imgTag: string) => void;
  disabled?: boolean;
}

const ImageUploader = ({ onImageUpload, disabled = false }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0); // 恢复上传进度状态

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setUploadMessage('');
    setUploadProgress(0); // 重置上传进度
    
    try {
      const imgTag = await processImageUpload(file, (progress) => {
        setUploadProgress(progress); // 更新上传进度
      });
      onImageUpload(imgTag);
      setUploadMessage('图片上传成功！');
      setTimeout(() => setUploadMessage(''), 2000);
    } catch (error) {
      setUploadMessage(`上传失败：${error instanceof Error ? error.message : '未知错误'}`);
      setTimeout(() => setUploadMessage(''), 3000);
    } finally {
      setUploading(false);
      setUploadProgress(0); // 重置上传进度
    }
  };

  return (
    <div className="image-uploader">
      {/* 上传状态反馈 */}
      {uploading && uploadProgress > 0 && uploadProgress < 100 && (
        <div style={{
          marginBottom: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            marginBottom: '0.25rem'
          }}>
            <span>上传进度:</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#e0e0e0',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              backgroundColor: '#3498db',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      )}
      
      {/* 上传消息 */}
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

      {/* 独立的图片上传按钮 */}
      <label
        htmlFor="image-upload"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.75rem',
          backgroundColor: disabled ? '#95a5a6' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem'
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
          disabled={disabled}
        />
      </label>
    </div>
  );
};

export default ImageUploader;
