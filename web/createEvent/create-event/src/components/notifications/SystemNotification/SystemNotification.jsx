import React, { useEffect, useState } from 'react';
import './SystemNotification.css';

function SystemNotification({ message, type, duration = 3000 }) {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (message) {
            setShouldRender(true);
            // Небольшая задержка перед показом для плавной анимации
            setTimeout(() => setIsVisible(true), 100);

            const hideTimer = setTimeout(() => {
                setIsVisible(false);
                // Удаляем компонент после завершения анимации скрытия
                setTimeout(() => setShouldRender(false), 500);
            }, duration);

            return () => {
                clearTimeout(hideTimer);
            };
        }
    }, [duration, message]);

    if (!shouldRender) return null;

    return (
        <div className={`system-notification ${type} ${isVisible ? 'visible' : ''}`}>
            <div className="notification-content">
                {type === 'error' && <span className="notification-icon">⚠️</span>}
                {type === 'success' && <span className="notification-icon">✅</span>}
                <span className="notification-message">{message}</span>
            </div>
            <div 
                className="notification-progress" 
                style={{ animationDuration: `${duration}ms` }} 
            />
        </div>
    );
}

export default SystemNotification; 