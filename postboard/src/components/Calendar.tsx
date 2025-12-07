import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Event as CalendarEvent, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, addWeeks, addDays, startOfMonth, endOfMonth, startOfWeek as startOfWeekDate, endOfWeek as endOfWeekDate, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Event } from '../types';
import { eventApi } from '../services/eventApi';
import EventForm from './EventForm';
import EventDetail from './EventDetail';

// 配置本地化
const locales = {
  'zh-CN': zhCN,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CalendarProps {
  isAdmin?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ isAdmin = false }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [view, setView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // 从后端获取活动数据
  const fetchEvents = async () => {
    try {
      const data = await eventApi.getAllEvents();
      setLocalEvents(data);
      // 转换为 react-big-calendar 所需的格式
      const calendarEvents = data.map((event: Event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        description: event.description,
      }));
      setEvents(calendarEvents);
    } catch (error) {
      console.error('获取活动失败:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 处理活动点击事件
  const handleEventClick = (event: CalendarEvent) => {
    // 查找对应的本地活动
    const localEvent = localEvents.find(e => e.id === event.id);
    if (localEvent) {
      setSelectedEvent(localEvent);
      setShowEventDetail(true);
    }
  };

  // 处理添加活动按钮点击
  const handleAddEvent = () => {
    setSelectedEvent(null);
    setShowEventForm(true);
  };

  // 处理编辑活动
  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowEventForm(true);
  };

  // 处理删除活动
  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('确定要删除这个活动吗？')) {
      try {
        await eventApi.deleteEvent(id);
        fetchEvents();
      } catch (error) {
        console.error('删除活动失败:', error);
      }
    }
  };

  // 处理活动保存
  const handleEventSave = async () => {
    setShowEventForm(false);
    fetchEvents();
  };

  // 处理视图切换
  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  // 处理日期导航
  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY' | Date) => {
    if (action === 'PREV') {
      switch (view) {
        case 'month':
          setCurrentDate(addMonths(currentDate, -1));
          break;
        case 'week':
          setCurrentDate(addWeeks(currentDate, -1));
          break;
        case 'day':
          setCurrentDate(addDays(currentDate, -1));
          break;
      }
    } else if (action === 'NEXT') {
      switch (view) {
        case 'month':
          setCurrentDate(addMonths(currentDate, 1));
          break;
        case 'week':
          setCurrentDate(addWeeks(currentDate, 1));
          break;
        case 'day':
          setCurrentDate(addDays(currentDate, 1));
          break;
      }
    } else if (action === 'TODAY') {
      setCurrentDate(new Date());
    } else {
      setCurrentDate(action);
    }
  };

  // 格式化当前日期显示
  const formatCurrentDate = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'yyyy年MM月', { locale: zhCN });
      case 'week':
        const weekStart = startOfWeekDate(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeekDate(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'MM月dd日', { locale: zhCN })} - ${format(weekEnd, 'MM月dd日', { locale: zhCN })}`;
      case 'day':
        return format(currentDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN });
      default:
        return format(currentDate, 'yyyy年MM月dd日', { locale: zhCN });
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>学校活动日历</h2>
        {isAdmin && (
          <button className="add-event-button" onClick={handleAddEvent}>
            添加活动
          </button>
        )}
        <div className="view-toggle">
          <button 
            className={`view-button ${view === 'month' ? 'active' : ''}`}
            onClick={() => handleViewChange('month')}
          >
            月视图
          </button>
          <button 
            className={`view-button ${view === 'week' ? 'active' : ''}`}
            onClick={() => handleViewChange('week')}
          >
            周视图
          </button>
          <button 
            className={`view-button ${view === 'day' ? 'active' : ''}`}
            onClick={() => handleViewChange('day')}
          >
            日视图
          </button>
        </div>
      </div>
      
      {/* 自定义导航控件 */}
      <div className="calendar-navigation">
        <button 
          className="nav-button" 
          onClick={() => handleNavigate('PREV')}
          title="上一个"
        >
          &lt;
        </button>
        <div className="current-date">{formatCurrentDate()}</div>
        <button 
          className="nav-button" 
          onClick={() => handleNavigate('NEXT')}
          title="下一个"
        >
          &gt;
        </button>
        <button 
          className="today-button" 
          onClick={() => handleNavigate('TODAY')}
        >
          今天
        </button>
      </div>
      
      <div className="calendar-wrapper">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={['month', 'week', 'day']}
          view={view}
          onView={handleViewChange}
          onSelectEvent={handleEventClick}
          style={{ height: 600 }}
          eventPropGetter={(event) => {
            // 检查活动是否已结束（结束时间早于当前时间）
            const isCompleted = new Date(event.end) < new Date();
            return {
              style: {
                backgroundColor: isCompleted ? '#a0aec0' : '#3182ce',
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: 'none',
              },
            };
          }}
          date={currentDate}
          onNavigate={handleNavigate as any}
          components={{
            // 自定义今天的日期样式
            dateCellWrapper: ({ children, value }) => {
              const isToday = format(value, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <div className={isToday ? 'today-cell' : ''}>
                  {children}
                </div>
              );
            },
          }}
        />
      </div>

      {/* 活动表单模态框 */}
      {showEventForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedEvent ? '编辑活动' : '添加活动'}</h3>
              <button 
                className="close-button" 
                onClick={() => setShowEventForm(false)}
              >
                ×
              </button>
            </div>
            <EventForm
              event={selectedEvent}
              onSave={handleEventSave}
              onCancel={() => setShowEventForm(false)}
            />
          </div>
        </div>
      )}

      {/* 活动详情模态框 */}
      {showEventDetail && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>活动详情</h3>
              <button 
                className="close-button" 
                onClick={() => setShowEventDetail(false)}
              >
                ×
              </button>
            </div>
            <EventDetail
              event={selectedEvent}
              isAdmin={isAdmin}
              onEdit={() => {
                setShowEventDetail(false);
                handleEditEvent(selectedEvent);
              }}
              onDelete={() => {
                setShowEventDetail(false);
                handleDeleteEvent(selectedEvent.id);
              }}
              onClose={() => setShowEventDetail(false)}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .calendar-header h2 {
          margin: 0;
          color: #2d3748;
        }

        .add-event-button {
          background-color: #3182ce;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .add-event-button:hover {
          background-color: #2b6cb0;
        }

        .view-toggle {
          display: flex;
          gap: 5px;
        }

        .view-button {
          background-color: #e2e8f0;
          color: #4a5568;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .view-button.active {
          background-color: #3182ce;
          color: white;
        }

        .view-button:hover:not(.active) {
          background-color: #cbd5e0;
        }

        /* 自定义导航控件样式 */
        .calendar-navigation {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
          gap: 10px;
          background-color: white;
          padding: 10px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .nav-button {
          background-color: #e2e8f0;
          color: #4a5568;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-button:hover {
          background-color: #cbd5e0;
        }

        .current-date {
          font-size: 16px;
          font-weight: 500;
          color: #2d3748;
          min-width: 150px;
          text-align: center;
        }

        .today-button {
          background-color: #3182ce;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .today-button:hover {
          background-color: #2b6cb0;
        }

        .calendar-wrapper {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 10px;
        }

        /* 自定义今天的日期样式 */
        .today-cell {
          position: relative;
        }

        .today-cell::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 30px;
          height: 30px;
          background-color: #3182ce;
          border-radius: 50%;
          z-index: -1;
        }

        .today-cell > div {
          color: white !important;
          font-weight: bold;
        }

        /* 调整日历组件样式 */
        .rbc-calendar {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .rbc-toolbar {
          display: none;
        }

        .rbc-month-view {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .rbc-header {
          background-color: #f7fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 10px;
          font-weight: 500;
          color: #2d3748;
        }

        .rbc-month-row {
          border-bottom: 1px solid #e2e8f0;
        }

        .rbc-date-cell {
          padding: 10px;
        }

        .rbc-event {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.4;
        }

        /* 模态框样式 */
        .modal-overlay {
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

        .modal-content {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          color: #2d3748;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #718096;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .close-button:hover {
          background-color: #f7fafc;
        }
      `}</style>
    </div>
  );
};

export default Calendar;
