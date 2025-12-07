import React, { useState, useEffect } from 'react';
import { Event, EventForm as EventFormType } from '../types';
import { eventApi } from '../services/eventApi';

interface EventFormProps {
  event: Event | null;
  onSave: () => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave, onCancel }) => {
  const [formData, setFormData] = useState<EventFormType>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
  });

  const [errors, setErrors] = useState<Partial<EventFormType>>({});

  // 当编辑现有活动时，填充表单数据
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        startDate: event.startDate.slice(0, 10), // 只保留到天
        endDate: event.endDate.slice(0, 10), // 只保留到天
        startTime: event.startTime || '', // 可选的开始时间
        endTime: event.endTime || '', // 可选的结束时间
      });
    } else {
      // 默认开始时间为今天，结束时间为今天
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      setFormData({
        title: '',
        description: '',
        startDate: today,
        endDate: today,
        startTime: '',
        endTime: '',
      });
    }
  }, [event]);

  // 表单验证
  const validateForm = () => {
    const newErrors: Partial<EventFormType> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入活动标题';
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入活动描述';
    }

    if (!formData.startDate) {
      newErrors.startDate = '请选择开始日期';
    }

    if (!formData.endDate) {
      newErrors.endDate = '请选择结束日期';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = '结束日期必须晚于或等于开始日期';
      }
    }

    // 如果选择了精确到时分，开始时间和结束时间必须都填写
    if ((formData.startTime && !formData.endTime) || (!formData.startTime && formData.endTime)) {
      newErrors.startTime = '如果选择了时分，开始时间和结束时间必须都填写';
      newErrors.endTime = '如果选择了时分，开始时间和结束时间必须都填写';
    }

    // 如果开始日期和结束日期相同，且填写了时间，确保结束时间晚于开始时间
    if (formData.startDate === formData.endDate && formData.startTime && formData.endTime) {
      if (formData.endTime <= formData.startTime) {
        newErrors.endTime = '结束时间必须晚于开始时间';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // 确保日期格式为 ISO 格式（包含时间部分，但时间固定为 00:00:00）
      const formattedData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      if (event) {
        // 更新现有活动
        await eventApi.updateEvent(event.id, formattedData);
      } else {
        // 创建新活动
        await eventApi.createEvent(formattedData);
      }
      onSave();
    } catch (error: any) {
      console.error('保存活动失败:', error);
      if (error.response?.data?.error) {
        // 处理后端返回的错误
        if (error.response.data.error === '已存在完全相同的活动') {
          setErrors({ title: error.response.data.error });
        } else {
          setErrors({ title: '保存失败，请重试' });
        }
      } else {
        setErrors({ title: '保存失败，请重试' });
      }
    }
  };

  // 处理表单字段变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // 清除对应字段的错误
    if (errors[name as keyof EventFormType]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <div className="form-group">
        <label htmlFor="title">活动标题</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={errors.title ? 'error' : ''}
          placeholder="请输入活动标题"
        />
        {errors.title && <div className="error-message">{errors.title}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="description">活动描述</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={errors.description ? 'error' : ''}
          placeholder="请输入活动描述"
          rows={5}
        />
        {errors.description && <div className="error-message">{errors.description}</div>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startDate">开始日期</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className={errors.startDate ? 'error' : ''}
          />
          {errors.startDate && <div className="error-message">{errors.startDate}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="endDate">结束日期</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className={errors.endDate ? 'error' : ''}
          />
          {errors.endDate && <div className="error-message">{errors.endDate}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startTime">开始时间（可选）</label>
          <div className="time-input-container">
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className={errors.startTime ? 'error' : ''}
            />
            {formData.startTime && (
              <button 
                type="button" 
                className="clear-time-button" 
                onClick={() => setFormData(prev => ({ ...prev, startTime: '' }))}
              >
                ×
              </button>
            )}
          </div>
          {errors.startTime && <div className="error-message">{errors.startTime}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="endTime">结束时间（可选）</label>
          <div className="time-input-container">
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className={errors.endTime ? 'error' : ''}
            />
            {formData.endTime && (
              <button 
                type="button" 
                className="clear-time-button" 
                onClick={() => setFormData(prev => ({ ...prev, endTime: '' }))}
              >
                ×
              </button>
            )}
          </div>
          {errors.endTime && <div className="error-message">{errors.endTime}</div>}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-button" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="save-button">
          {event ? '保存修改' : '添加活动'}
        </button>
      </div>

      <style jsx>{`
        .event-form {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .form-row .form-group {
          flex: 1;
          min-width: 200px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #2d3748;
          font-size: 14px;
        }

        input,
        textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        /* 时间输入容器样式 */
        .time-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        /* 清空时间按钮样式 */
        .clear-time-button {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #718096;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .clear-time-button:hover {
          background-color: #e2e8f0;
          color: #4a5568;
        }

        /* 确保输入框有足够的右边距，避免被清空按钮遮挡 */
        input[type="time"] {
          padding-right: 30px;
        }

        input:focus,
        textarea:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        input.error,
        textarea.error {
          border-color: #e53e3e;
        }

        input.error:focus,
        textarea.error:focus {
          box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
        }

        textarea {
          resize: vertical;
          min-height: 100px;
        }

        .error-message {
          color: #e53e3e;
          font-size: 12px;
          margin-top: 4px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .cancel-button {
          background-color: #e2e8f0;
          color: #4a5568;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .cancel-button:hover {
          background-color: #cbd5e0;
        }

        .save-button {
          background-color: #3182ce;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .save-button:hover {
          background-color: #2b6cb0;
        }

        .save-button:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
};

export default EventForm;
