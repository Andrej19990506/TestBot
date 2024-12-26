import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreateEvent.module.css';
import MobileLayout from '../layouts/MobileLayout';
import DesktopLayout from '../layouts/DesktopLayout';
import { useTheme } from '../../hooks/useTheme';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import TextArea from '../common/Textarea/TextArea';
import DateTimePicker from '../DateTimePicker/DateTimePicker';
import RepeatSettings from '../RepeatSettings';
import NotificationManager from '../notifications/NotificationManager';
import ChatSelector from '../ChatSelector';
import { useApi } from '../../hooks/useApi';
import SuccessScreen from '../common/SuccessScreen/SuccessScreen';
import { AnimatePresence } from 'framer-motion';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [description, setDescription] = useState('');
    const { theme } = useTheme();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [selectedDate, setSelectedDate] = useState(null);
    const [repeatType, setRepeatType] = useState('none');
    const [selectedWeekdays, setSelectedWeekdays] = useState([]);
    const [monthDay, setMonthDay] = useState(null);
    const [selectedChats, setSelectedChats] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [errors, setErrors] = useState({
        description: false,
        date: false,
        notifications: false,
        chats: false
    });
    const [isSuccess, setIsSuccess] = useState(false);
    const { createEvent: apiCreateEvent } = useApi();

    const formatDateForApi = (date) => {
        if (!date) return null;
        return new Date(date).toISOString().slice(0, 16).replace('T', ' ');
    };

    const validateStep = useCallback((step) => {
        const newErrors = { ...errors };
        let isValid = true;

        switch (step) {
            case 1:
                if (!description.trim()) {
                    newErrors.description = true;
                    isValid = false;
                } else {
                    newErrors.description = false;
                }
                break;
            case 2:
                if (!selectedDate) {
                    newErrors.date = true;
                    isValid = false;
                } else {
                    newErrors.date = false;
                }
                break;
            case 4:
                if (notifications.length === 0) {
                    newErrors.notifications = true;
                    isValid = false;
                } else {
                    newErrors.notifications = false;
                }
                break;
            case 5:
                if (selectedChats.length === 0) {
                    newErrors.chats = true;
                    isValid = false;
                } else {
                    newErrors.chats = false;
                }
                break;
        }

        setErrors(newErrors);
        return isValid;
    }, [description, selectedDate, notifications, selectedChats, errors]);

    const canProceedToNextStep = useCallback(() => {
        switch (currentStep) {
            case 1:
                return description.trim().length > 0;
            case 2:
                return selectedDate !== null;
            case 3:
                return true;
            case 4:
                return notifications.length > 0;
            case 5:
                return selectedChats.length > 0;
            default:
                return false;
        }
    }, [currentStep, description, selectedDate, notifications, selectedChats]);

    const handleStepChange = useCallback((step) => {
        setCurrentStep(step);
    }, []);

    const handleRepeatTypeChange = (type) => {
        setRepeatType(type);
        if (type === 'none') {
            setSelectedWeekdays([]);
            setMonthDay(null);
        }
        if (type === 'weekly') {
            const today = new Date().getDay();
            setSelectedWeekdays([today]);
        }
        if (type === 'monthly') {
            setMonthDay(new Date().getDate());
        }
    };

    const handleWeekdayChange = (day) => {
        setSelectedWeekdays(prev => 
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const handleMonthDayChange = (day) => {
        setMonthDay(day);
    };

    const handleChatSelect = (chatIds) => {
        setSelectedChats(chatIds);
    };

    const handleNotificationsChange = (newNotifications) => {
        setNotifications(newNotifications);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <TextArea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Описание события..."
                        maxLength={1000}
                    />
                );
            case 2:
                return (
                    <DateTimePicker
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                    />
                );
            case 3:
                return (
                    <RepeatSettings
                        repeatType={repeatType}
                        selectedWeekdays={selectedWeekdays}
                        monthDay={monthDay}
                        onRepeatTypeChange={handleRepeatTypeChange}
                        onWeekdayChange={handleWeekdayChange}
                        onMonthDayChange={handleMonthDayChange}
                    />
                );
            case 4:
                return (
                    <NotificationManager 
                        notifications={notifications}
                        onNotificationsChange={handleNotificationsChange}
                    />
                );
            case 5:
                return (
                    <ChatSelector
                        selectedChats={selectedChats}
                        onChatSelect={handleChatSelect}
                    />
                );
            default:
                return null;
        }
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            
            // Получаем выбранную дату
            const localDate = new Date(selectedDate);
            console.log('Selected local date:', localDate.toLocaleString());
            
            // Создаем объект с часовым поясом Красноярска
            const krasnoyarskDate = new Date(localDate);
            
            // Форматируем дату в строку YYYY-MM-DD HH:mm в Красноярском времени
            const formattedDate = krasnoyarskDate.toLocaleString('sv', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Krasnoyarsk'
            }).replace('T', ' ');
            
            console.log('Formatted date (Krasnoyarsk time):', formattedDate);
            
            const eventData = {
                description: description,
                date: formattedDate,
                repeat: {
                    type: repeatType,
                    weekdays: selectedWeekdays,
                    monthDay: monthDay
                },
                notifications: notifications.map(n => ({
                    message: n.message,
                    time: parseInt(n.time)
                })),
                chat_ids: selectedChats
            };
            
            console.log('Event data being sent:', eventData);
            
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            });

            setIsSuccess(true);
            setTimeout(() => {
                navigate('/events');
            }, 1500);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.pageWrapper} data-theme={theme}>
            <AnimatePresence>
                {isSuccess ? (
                    <SuccessScreen />
                ) : (
                    isMobile ? (
                        <MobileLayout
                            currentStep={currentStep}
                            onStepChange={handleStepChange}
                            isLoading={isLoading}
                            canProceed={canProceedToNextStep()}
                            onSubmit={handleSubmit}
                        >
                            <div className={styles.stepContent}>
                                {renderStepContent()}
                            </div>
                        </MobileLayout>
                    ) : (
                        <DesktopLayout>
                            {/* Десктопная версия */}
                        </DesktopLayout>
                    )
                )}
            </AnimatePresence>
        </div>
    );
};

export default CreateEvent; 