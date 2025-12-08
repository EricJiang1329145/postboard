// 图片上传服务
import axios from 'axios';

/**
 * 上传图片到服务器
 * @param file 要上传的图片文件
 * @param onProgress 上传进度回调函数
 * @returns 上传成功后返回图片URL
 */
export const uploadImage = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const response = await axios.post(`${apiUrl}/upload`, formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    if (!response.data) {
      throw new Error('图片上传失败');
    }

    return response.data.url;
  } catch (error) {
    console.error('图片上传错误:', error);
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error instanceof Error ? error : new Error('图片上传失败');
  }
};
