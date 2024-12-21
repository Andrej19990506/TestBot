import React, { useEffect, useState } from 'react';
import './Notification.css';

function Notification({ message, type, duration = 3000 }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Показываем уведомление
        setIsVisible(true);

        // Устанавливаем таймер для скрытия
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, message]); // Добавляем message в зависимости, чтобы сбрасывать таймер при новом сообщении

    if (!message) return null;

    return (
        <div className={`notification ${type} ${isVisible ? 'visible' : ''}`}>
            <div className="notification-content">
                {type === 'error' && <span className="notification-icon">⚠️</span>}
                {type === 'success' && <span className="notification-icon">✅</span>}
                <span className="notification-message">{message}</span>
            </div>
            <div className="notification-progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
    );
}

export default Notification;
