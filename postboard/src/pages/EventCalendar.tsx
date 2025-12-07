import React from 'react';
import Calendar from '../components/Calendar';

const EventCalendar: React.FC = () => {
  return (
    <div className="event-calendar-page">
      <Calendar isAdmin={false} />
      
      <style>{`
        .event-calendar-page {
          min-height: 100vh;
          background-color: #f7fafc;
        }
      `}</style>
    </div>
  );
};

export default EventCalendar;
