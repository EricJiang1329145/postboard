import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useEventStore } from '../context/useStore';
import { useUserStore } from '../context/useStore';
import { Event, EventForm } from '../types';
import dayjs from 'dayjs';

const EventCalendar: React.FC = () => {
  // 状态管理
  const { events, fetchEvents, addEvent, updateEvent, deleteEvent } = useEventStore();
  const { currentUser } = useUserStore();
  const isAdmin = currentUser?.role === 'admin';
  
  // 日历视图状态
  const [view, setView] = useState<any>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // 表单状态
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState<EventForm>({
    title: '',
    description: '',
    startDate: dayjs().format('YYYY-MM-DDTHH:mm'),
    endDate: dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm')
  });
  
  // 加载活动数据
  useEffect(() => {
    fetchEvents();
  }, []);
  
  // 处理日期选择
  const handleDateChange = (value: any, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (Array.isArray(value)) {
      // 范围选择（周/日视图可能需要）
      setSelectedDate(value[0]);
    } else {
      // 单个日期选择
      if (value) {
        setSelectedDate(value);
      }
    }
  };
  
  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理开始时间变化
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        startDate: dayjs(date).format('YYYY-MM-DDTHH:mm')
      }));
    }
  };
  
  // 处理结束时间变化
  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        endDate: dayjs(date).format('YYYY-MM-DDTHH:mm')
      }));
    }
  };
  
  // 处理添加活动
  const handleAddEvent = async () => {
    if (formData.title && formData.description && formData.startDate && formData.endDate) {
      await addEvent(formData);
      setIsAddingEvent(false);
      setFormData({
        title: '',
        description: '',
        startDate: dayjs().format('YYYY-MM-DDTHH:mm'),
        endDate: dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm')
      });
    }
  };
  
  // 处理编辑活动
  const handleEditEvent = async () => {
    if (selectedEvent && formData.title && formData.description && formData.startDate && formData.endDate) {
      await updateEvent(selectedEvent.id, formData);
      setIsEditingEvent(false);
      setSelectedEvent(null);
      setFormData({
        title: '',
        description: '',
        startDate: dayjs().format('YYYY-MM-DDTHH:mm'),
        endDate: dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm')
      });
    }
  };
  
  // 处理删除活动
  const handleDeleteEvent = async () => {
    if (selectedEvent) {
      await deleteEvent(selectedEvent.id);
      setIsDeletingEvent(false);
      setSelectedEvent(null);
    }
  };
  
  // 打开添加活动表单
  const openAddEventForm = () => {
    setIsAddingEvent(true);
    setIsEditingEvent(false);
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      startDate: dayjs().format('YYYY-MM-DDTHH:mm'),
      endDate: dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm')
    });
  };
  
  // 打开编辑活动表单
  const openEditEventForm = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate
    });
    setIsEditingEvent(true);
    setIsAddingEvent(false);
  };
  
  // 打开删除确认对话框
  const openDeleteEventDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsDeletingEvent(true);
  };
  
  // 关闭所有对话框
  const closeAllDialogs = () => {
    setIsAddingEvent(false);
    setIsEditingEvent(false);
    setIsDeletingEvent(false);
    setSelectedEvent(null);
  };
  
  // 获取指定日期的活动
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  // 自定义日历 tile 内容
  const tileContent = ({ date }: { date: Date }) => {
    const dateEvents = getEventsForDate(date);
    if (dateEvents.length === 0) return null;
    
    return (
      <div className="event-indicators">
        {dateEvents.slice(0, 3).map((event) => (
          <div 
            key={event.id} 
            className="event-indicator" 
            title={`${event.title} - ${dayjs(event.startDate).format('HH:mm')}-${dayjs(event.endDate).format('HH:mm')}`}
          >
            {event.title}
          </div>
        ))}
        {dateEvents.length > 3 && (
          <div className="event-more" title={`还有 ${dateEvents.length - 3} 个活动`}>
            +{dateEvents.length - 3}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="event-calendar-container">
      <h1>学校活动日历</h1>
      
      {/* 日历控制栏 */}
      <div className="calendar-controls">
        <div className="view-buttons">
          <button 
            className={view === 'month' ? 'active' : ''}
            onClick={() => setView('month')}
          >
            月视图
          </button>
          <button 
            className={view === 'week' ? 'active' : ''}
            onClick={() => setView('week')}
          >
            周视图
          </button>
          <button 
            className={view === 'day' ? 'active' : ''}
            onClick={() => setView('day')}
          >
            日视图
          </button>
        </div>
        
        {isAdmin && (
          <button className="add-event-btn" onClick={openAddEventForm}>
            添加活动
          </button>
        )}
      </div>
      
      {/* 日历组件 */}
      <div className="calendar-wrapper">
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          view={view}
          tileContent={tileContent}
          className="school-calendar"
        />
      </div>
      
      {/* 选中日期的活动列表 */}
      <div className="selected-date-events">
        <h3>{dayjs(selectedDate).format('YYYY年MM月DD日')} 的活动</h3>
        <div className="events-list">
          {getEventsForDate(selectedDate).length === 0 ? (
            <p className="no-events">当天没有活动</p>
          ) : (
            getEventsForDate(selectedDate).map(event => (
              <div key={event.id} className="event-item">
                <div className="event-header">
                  <h4>{event.title}</h4>
                  {isAdmin && (
                    <div className="event-actions">
                      <button 
                        className="edit-btn" 
                        onClick={() => openEditEventForm(event)}
                      >
                        编辑
                      </button>
                      <button 
                        className="delete-btn" 
                        onClick={() => openDeleteEventDialog(event)}
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>
                <div className="event-time">
                  {dayjs(event.startDate).format('HH:mm')} - {dayjs(event.endDate).format('HH:mm')}
                </div>
                <div className="event-description">
                  {event.description}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* 添加/编辑活动对话框 */}
      {(isAddingEvent || isEditingEvent) && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <h3>{isAddingEvent ? '添加活动' : '编辑活动'}</h3>
              <button className="close-btn" onClick={closeAllDialogs}>
                ×
              </button>
            </div>
            <div className="dialog-content">
              <form>
                <div className="form-group">
                  <label htmlFor="title">活动标题</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">活动描述</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">开始时间</label>
                    <DatePicker
                      selected={new Date(formData.startDate)}
                      onChange={handleStartDateChange}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={30}
                      dateFormat="yyyy-MM-dd HH:mm"
                      className="date-picker"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">结束时间</label>
                    <DatePicker
                      selected={new Date(formData.endDate)}
                      onChange={handleEndDateChange}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={30}
                      dateFormat="yyyy-MM-dd HH:mm"
                      className="date-picker"
                      required
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="dialog-footer">
              <button className="cancel-btn" onClick={closeAllDialogs}>
                取消
              </button>
              <button 
                className="save-btn" 
                onClick={isAddingEvent ? handleAddEvent : handleEditEvent}
              >
                {isAddingEvent ? '添加' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 删除确认对话框 */}
      {isDeletingEvent && selectedEvent && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <h3>确认删除</h3>
              <button className="close-btn" onClick={closeAllDialogs}>
                ×
              </button>
            </div>
            <div className="dialog-content">
              <p>确定要删除活动 "{selectedEvent.title}" 吗？此操作无法撤销。</p>
            </div>
            <div className="dialog-footer">
              <button className="cancel-btn" onClick={closeAllDialogs}>
                取消
              </button>
              <button className="delete-btn" onClick={handleDeleteEvent}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 样式 */}
      <style>{`
        .event-calendar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 20px;
          color: #333;
        }
        
        .calendar-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .view-buttons {
          display: flex;
          gap: 10px;
        }
        
        .view-buttons button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background-color: #f5f5f5;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .view-buttons button.active {
          background-color: #4CAF50;
          color: white;
          border-color: #4CAF50;
        }
        
        .add-event-btn {
          padding: 8px 16px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .add-event-btn:hover {
          background-color: #45a049;
        }
        
        .calendar-wrapper {
          margin-bottom: 30px;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .school-calendar {
          width: 100%;
          border: none;
        }
        
        .event-indicators {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 5px;
        }
        
        .event-indicator {
          background-color: #4CAF50;
          color: white;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .event-more {
          font-size: 10px;
          color: #666;
          text-align: center;
        }
        
        .selected-date-events {
          margin-top: 30px;
        }
        
        .selected-date-events h3 {
          margin-bottom: 15px;
          color: #333;
        }
        
        .events-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .event-item {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          background-color: #f9f9f9;
        }
        
        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .event-header h4 {
          margin: 0;
          color: #333;
        }
        
        .event-actions {
          display: flex;
          gap: 10px;
        }
        
        .edit-btn, .delete-btn {
          padding: 5px 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s ease;
        }
        
        .edit-btn {
          background-color: #2196F3;
          color: white;
        }
        
        .delete-btn {
          background-color: #f44336;
          color: white;
        }
        
        .event-time {
          color: #666;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .event-description {
          color: #333;
          line-height: 1.5;
        }
        
        .no-events {
          color: #666;
          text-align: center;
          padding: 20px;
        }
        
        /* 对话框样式 */
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .dialog {
          background-color: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #ddd;
        }
        
        .dialog-header h3 {
          margin: 0;
          color: #333;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
        }
        
        .dialog-content {
          padding: 20px;
        }
        
        .dialog-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 15px 20px;
          border-top: 1px solid #ddd;
        }
        
        .cancel-btn, .save-btn, .delete-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .cancel-btn {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        
        .save-btn {
          background-color: #4CAF50;
          color: white;
        }
        
        /* 表单样式 */
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-row {
          display: flex;
          gap: 15px;
        }
        
        .form-row .form-group {
          flex: 1;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          color: #333;
          font-size: 14px;
        }
        
        input, textarea, .date-picker {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }
        
        textarea {
          resize: vertical;
          min-height: 80px;
        }
      `}</style>
    </div>
  );
};

export default EventCalendar;
