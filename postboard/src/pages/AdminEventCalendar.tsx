import React from 'react';
import Calendar from '../components/Calendar';

const AdminEventCalendar: React.FC = () => {
  return (
    <div className="admin-event-calendar-page">
      <Calendar isAdmin={true} />
      
      <style>{`
        .admin-event-calendar-page {
          min-height: 100vh;
          background-color: #f7fafc;
        }
      `}</style>
    </div>
  );
};

export default AdminEventCalendar;
