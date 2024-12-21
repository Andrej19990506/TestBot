import React, { useEffect, useState } from 'react';
import './SystemNotification.css';

function SystemNotification({ message, type, duration = 3000 }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => setIsVisible(false), duration);
            return () => clearTimeout(timer);
        }
    }, [duration, message]);

    if (!message) return null;

    return (
        <div className={`system-notification ${type} ${isVisible ? 'visible' : ''}`}>
            <div className="notification-content">
                {type === 'error' && <span className="notification-icon">⚠️</span>}
                {type === 'success' && <span className="notification-icon">✅</span>}
                <span className="notification-message">{message}</span>
            </div>
            <div className="notification-progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
    );
}

export default SystemNotification; 