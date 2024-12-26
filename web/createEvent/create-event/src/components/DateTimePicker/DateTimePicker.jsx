import React, { useState } from 'react';
import styles from './DateTimePicker.module.css';
import SystemNotification from '../notifications/SystemNotification/SystemNotification';

const DateTimePicker = ({ selectedDate, onDateChange }) => {
    const [notification, setNotification] = useState({
        message: '',
        type: '',
        show: false
    });
    const [isError, setIsError] = useState(false);

    const vibrate = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    };

    const formatDateForInput = (date) => {
        if (!date) return '';
        const krasnoyarskDate = new Date(date);
        return krasnoyarskDate.toLocaleString('sv', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Krasnoyarsk'
        }).replace(' ', 'T');
    };

    const getMinDate = () => {
        const now = new Date();
        return now.toLocaleString('sv', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Krasnoyarsk'
        }).replace(' ', 'T');
    };

    const handleDateChange = (e) => {
        const value = e.target.value;
        if (!value) {
            onDateChange(null);
            return;
        }

        const localDate = new Date(value);
        console.log('Selected local date:', localDate.toLocaleString());
        
        const krasnoyarskDate = new Date(localDate);
        
        const now = new Date();

        if (krasnoyarskDate < now) {
            setNotification({
                message: 'Выбранная дата в прошлом. Устанавливаем ближайшее возможное время.',
                type: 'error',
                show: true
            });

            setIsError(true);
            vibrate();

            const minDate = new Date(now.getTime() + 5 * 60000);
            onDateChange(minDate);

            setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
                setIsError(false);
            }, 5000);
            
            return;
        }

        setIsError(false);
        onDateChange(krasnoyarskDate);
    };

    return (
        <div className={styles.dateTimeContainer}>
            {notification.show && (
                <SystemNotification 
                    message={notification.message}
                    type={notification.type}
                    duration={5000}
                />
            )}
            
            <div className={styles.inputWrapper}>
                <input
                    type="datetime-local"
                    className={`${styles.dateTimeInput} ${isError ? styles.error : ''}`}
                    value={formatDateForInput(selectedDate)}
                    onChange={handleDateChange}
                    min={getMinDate()}
                />
                <div className={`${styles.inputIcon} ${isError ? styles.error : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                </div>
            </div>
            
            {selectedDate && (
                <div className={styles.selectedDateDisplay}>
                    <div className={styles.datePreview}>
                        {new Date(selectedDate).toLocaleString('ru-RU', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Krasnoyarsk'
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateTimePicker; 