import React from 'react';
import { Event } from '../types';

interface EventDetailProps {
  event: Event;
  isAdmin?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ 
  event, 
  isAdmin = false, 
  onEdit, 
  onDelete, 
  onClose 
}) => {
  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="event-detail">
      <div className="detail-section">
        <h3 className="event-title">{event.title}</h3>
        <div className="event-description">
          {event.description}
        </div>
      </div>

      <div className="detail-section">
        <h4>时间信息</h4>
        <div className="event-time">
          <div className="time-item">
            <span className="time-label">开始时间：</span>
            <span className="time-value">{formatDateTime(event.startDate)}</span>
          </div>
          <div className="time-item">
            <span className="time-label">结束时间：</span>
            <span className="time-value">{formatDateTime(event.endDate)}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h4>创建信息</h4>
        <div className="event-meta">
          <div className="meta-item">
            <span className="meta-label">创建时间：</span>
            <span className="meta-value">{formatDateTime(event.createdAt)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">最后更新：</span>
            <span className="meta-value">{formatDateTime(event.updatedAt)}</span>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="detail-actions">
          <button className="edit-button" onClick={onEdit}>
            编辑活动
          </button>
          <button className="delete-button" onClick={onDelete}>
            删除活动
          </button>
        </div>
      )}

      <div className="detail-footer">
        <button className="close-button" onClick={onClose}>
          关闭
        </button>
      </div>

      <style jsx>{`
        .event-detail {
          padding: 20px;
        }

        .detail-section {
          margin-bottom: 24px;
        }

        .event-title {
          margin: 0 0 16px 0;
          color: #2d3748;
          font-size: 20px;
          font-weight: 600;
        }

        .event-description {
          color: #4a5568;
          line-height: 1.6;
          white-space: pre-wrap;
          background-color: #f7fafc;
          padding: 16px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        h4 {
          margin: 0 0 12px 0;
          color: #2d3748;
          font-size: 16px;
          font-weight: 500;
        }

        .event-time,
        .event-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .time-item,
        .meta-item {
          display: flex;
          align-items: center;
          font-size: 14px;
        }

        .time-label,
        .meta-label {
          width: 100px;
          color: #718096;
          font-weight: 500;
        }

        .time-value,
        .meta-value {
          color: #2d3748;
        }

        .detail-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
        }

        .edit-button,
        .delete-button,
        .close-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .edit-button {
          background-color: #3182ce;
          color: white;
        }

        .edit-button:hover {
          background-color: #2b6cb0;
        }

        .delete-button {
          background-color: #e53e3e;
          color: white;
        }

        .delete-button:hover {
          background-color: #c53030;
        }

        .detail-footer {
          display: flex;
          justify-content: flex-end;
        }

        .close-button {
          background-color: #e2e8f0;
          color: #4a5568;
        }

        .close-button:hover {
          background-color: #cbd5e0;
        }
      `}</style>
    </div>
  );
};

export default EventDetail;
