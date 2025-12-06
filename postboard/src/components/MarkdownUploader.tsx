import { useState } from 'react';

interface MarkdownUploaderProps {
  onFileRead: (content: string) => void;
}

const MarkdownUploader = ({ onFileRead }: MarkdownUploaderProps) => {
  const [fileName, setFileName] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // 读取文件内容
  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileName(file.name);
      setPreviewContent(content);
      onFileRead(content);
    };
    reader.readAsText(file);
  };

  // 文件选择处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
        readFile(file);
        setShowPreview(true);
      } else {
        alert('请选择Markdown文件(.md)');
        e.target.value = '';
      }
    }
  };

  // 清除文件
  const handleClear = () => {
    setFileName('');
    setPreviewContent('');
    setShowPreview(false);
    onFileRead('');
  };

  // 导入到编辑器
  const handleImport = () => {
    onFileRead(previewContent);
    setShowPreview(false);
  };

  return (
    <div className="markdown-uploader">
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="file-upload" style={{ 
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#3498db',
          color: 'white',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500'
        }}>
          选择MD文件
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".md,text/markdown"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {fileName && (
          <span style={{ marginLeft: '1rem', color: '#666' }}>
            已选择: {fileName}
          </span>
        )}
        {fileName && (
          <button
            type="button"
            onClick={handleClear}
            style={{ 
              marginLeft: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            清除
          </button>
        )}
      </div>

      {showPreview && previewContent && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '0.5rem'
          }}>
            <h4>文件预览</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleImport}
                style={{ 
                  padding: '0.5rem 1rem',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                导入到编辑器
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                style={{ 
                  padding: '0.5rem 1rem',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                关闭预览
              </button>
            </div>
          </div>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '1rem',
            backgroundColor: '#fafafa',
            maxHeight: '300px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}>
            <pre>{previewContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownUploader;
