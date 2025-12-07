import { uploadImage } from '../services/imageUpload';

// 处理图片上传的通用函数
export const processImageUpload = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
  const url = await uploadImage(file, onProgress);
  
  // 可配置的默认宽高参数
  const defaultWidth = 500; // 默认宽度
  const defaultHeight = 300; // 默认高度
  
  // 创建图片对象获取原始宽高比例
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = URL.createObjectURL(file);
  });
  
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
  return `<img src="${url}" width="${width}" height="${height}" alt="${file.name}">`;
};