// 图片上传服务

/**
 * 上传图片到服务器
 * @param file 要上传的图片文件
 * @returns 上传成功后返回图片URL
 */
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '图片上传失败');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('图片上传错误:', error);
    throw error;
  }
};
