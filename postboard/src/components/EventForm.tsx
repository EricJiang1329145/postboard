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
  });

  const [errors, setErrors] = useState<Partial<EventFormType>>({});

  // 当编辑现有活动时，填充表单数据
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        startDate: event.startDate.slice(0, 16), // 保留到分钟
        endDate: event.endDate.slice(0, 16), // 保留到分钟
      });
    } else {
      // 默认开始时间为当前时间，结束时间为当前时间后1小时
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      setFormData({
        title: '',
        description: '',
        startDate: now.toISOString().slice(0, 16),
        endDate: end.toISOString().slice(0, 16),
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
      newErrors.startDate = '请选择开始时间';
    }

    if (!formData.endDate) {
      newErrors.endDate = '请选择结束时间';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = '结束时间必须晚于开始时间';
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
      if (event) {
        // 更新现有活动
        await eventApi.updateEvent(event.id, formData);
      } else {
        // 创建新活动
        await eventApi.createEvent(formData);
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
          <label htmlFor="startDate">开始时间</label>
          <input
            type="datetime-local"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className={errors.startDate ? 'error' : ''}
          />
          {errors.startDate && <div className="error-message">{errors.startDate}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="endDate">结束时间</label>
          <input
            type="datetime-local"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className={errors.endDate ? 'error' : ''}
          />
          {errors.endDate && <div className="error-message">{errors.endDate}</div>}
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
