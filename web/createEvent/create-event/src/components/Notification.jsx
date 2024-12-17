import React, { useEffect } from 'react';

function Notification({ message, type }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Убираем уведомление через 3 секунды
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`notification ${type}`}>
      {message}
    </div>
  );
}

export default Notification;
