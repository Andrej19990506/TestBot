import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../common/Header/Header';
import Footer from '../common/Footer/Footer';
import TextArea from '../common/Textarea/TextArea';
import ChatSelector from '../ChatSelector';
import DatePicker from '../DatePicker';
import Button from '../common/Button/Button';
import RepeatSettings from '../RepeatSettings';
import { AddNotificationButton } from '../notifications/EventNotifications/NotificationButton';
import NotificationItem from '../notifications/EventNotifications/NotificationItem';
import styles from './CreateEvent.module.css';
import MobileLayout from '../layouts/MobileLayout';

const CreateEvent = () => {
    const [description, setDescription] = useState('');
    const [selectedChats, setSelectedChats] = useState([]);
    const [isChatsOpen, setIsChatsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [repeatType, setRepeatType] = useState('none');
    const [selectedWeekdays, setSelectedWeekdays] = useState([]);
    const [monthDay, setMonthDay] = useState(null);
    const [notification, setNotification] = useState(null);
    const [isAddingNotification, setIsAddingNotification] = useState(false);
    const [currentNotification, setCurrentNotification] = useState(null);
    const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
    
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 340);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 340);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
    };

    const handleChatSelect = (chats) => {
        setSelectedChats(chats);
    };

    const handleDateChange = (date) => {
        console.log('CreateEvent received new date:', date);
        setSelectedDate(date);
    };

    const handleRepeatTypeChange = (type) => {
        if (type === 'none') {
            setSelectedWeekdays([]);
            setMonthDay(null);
        }
        setRepeatType(type);
    };

    const handleAddNotification = () => {
        const newNotification = {
            id: Date.now(),
            time: 5,
            message: ''
        };
        setCurrentNotification(newNotification);
        setIsAddingNotification(true);
    };

    const handleUpdateNotification = (field, value) => {
        setCurrentNotification(notification);
        setIsAddingNotification(true);
        setNotification(null);
        
        setCurrentNotification(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveNotification = () => {
        if (!currentNotification?.message?.trim()) {
            setIsAddingNotification(false);
            setCurrentNotification(null);
            return;
        }

        setNotification(currentNotification);
        setIsAddingNotification(false);
        setCurrentNotification(null);
    };

    const handleDeleteNotification = () => {
        setNotification(null);
        setIsAddingNotification(false);
        setCurrentNotification(null);
    };

    const handleWeekdayChange = (day) => {
        setSelectedWeekdays(prev => {
            if (prev.includes(day)) {
                return prev.filter(d => d !== day);
            }
            return [...prev, day].sort((a, b) => a - b);
        });
    };

    return (
        <div className={styles.pageWrapper}>
            <Header />
            <main className={styles.container}>
                {isMobileView ? (
                    <MobileLayout 
                        description={description}
                        selectedDate={selectedDate}
                        repeatType={repeatType}
                        selectedWeekdays={selectedWeekdays}
                        monthDay={monthDay}
                        notification={notification}
                        selectedChats={selectedChats}
                        isAddingNotification={isAddingNotification}
                        currentNotification={currentNotification}
                        onDescriptionChange={handleDescriptionChange}
                        onDateChange={handleDateChange}
                        onRepeatTypeChange={handleRepeatTypeChange}
                        onWeekdayChange={handleWeekdayChange}
                        onMonthDayChange={setMonthDay}
                        onNotificationUpdate={handleUpdateNotification}
                        onNotificationDelete={handleDeleteNotification}
                        onChatSelect={handleChatSelect}
                        onAddNotification={handleAddNotification}
                        onSaveNotification={handleSaveNotification}
                    />
                ) : (
                    <div className={styles.columns}>
                        <div className={styles.column}>
                            <div className={styles.columnContent}>
                                <div className={styles.textareaSection}>
                                    <TextArea 
                                        value={description}
                                        onChange={handleDescriptionChange}
                                    />
                                </div>
                                <div className={styles.notificationsSection}>
                                    <h3 className={styles.sectionTitle}>Уведомления</h3>
                                    <div className={styles.notificationsContainer}>
                                        {notification && !isAddingNotification && (
                                            <NotificationItem
                                                notification={notification}
                                                onUpdate={handleUpdateNotification}
                                                onDelete={handleDeleteNotification}
                                            />
                                        )}
                                    </div>
                                    {(!notification || isAddingNotification) && (
                                        isAddingNotification ? (
                                            <div className={styles.addingNotificationContainer}>
                                                <NotificationItem
                                                    notification={currentNotification}
                                                    onUpdate={(field, value) => 
                                                        setCurrentNotification({
                                                            ...currentNotification,
                                                            [field]: value
                                                        })
                                                    }
                                                    onDelete={() => {
                                                        setIsAddingNotification(false);
                                                        setCurrentNotification(null);
                                                    }}
                                                />
                                                <button 
                                                    className={styles.saveNotificationBtn}
                                                    onClick={handleSaveNotification}
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        ) : (
                                            <AddNotificationButton 
                                                onClick={handleAddNotification}
                                                className={styles.addNotificationBtn}
                                            >
                                                Добавить уведомление
                                            </AddNotificationButton>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className={styles.bottomSection}>
                                <div className={styles.chatsWrapper}>
                                    <Button 
                                        variant="selectChats"
                                        onClick={() => setIsChatsOpen(!isChatsOpen)}
                                        selected={selectedChats.length > 0}
                                    >
                                        {selectedChats.length > 0 
                                            ? `Выбрано чатов: ${selectedChats.length}`
                                            : 'Выбрать чаты'
                                        }
                                    </Button>
                                    <AnimatePresence>
                                        {isChatsOpen && (
                                            <motion.div 
                                                className={styles.chatsContainer}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 5 }}
                                            >
                                                <ChatSelector 
                                                    selectedChats={selectedChats}
                                                    onChatSelect={handleChatSelect}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {!isMobileView ? (
                            <div className={`${styles.column} ${styles.rightColumn}`}>
                                <div className={styles.dateTimeSection}>
                                    <div className={styles.datePickerWrapper}>
                                        <h3 className={styles.sectionTitle}>Дата и время</h3>
                                        <DatePicker 
                                            value={selectedDate}
                                            onChange={handleDateChange}
                                        />
                                    </div>
                                </div>
                                <div className={styles.repeatSection}>
                                    <RepeatSettings
                                        repeatType={repeatType}
                                        selectedWeekdays={selectedWeekdays}
                                        monthDay={monthDay}
                                        onRepeatTypeChange={handleRepeatTypeChange}
                                        onWeekdayChange={(day) => {
                                            setSelectedWeekdays(prev => {
                                                if (prev.includes(day)) {
                                                    return prev.filter(d => d !== day);
                                                }
                                                return [...prev, day].sort((a, b) => a - b);
                                            });
                                        }}
                                        onMonthDayChange={setMonthDay}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className={styles.mobileRightColumn}>
                                <button 
                                    className={styles.mobileSettingsButton}
                                    onClick={() => setIsMobileSettingsOpen(true)}
                                >
                                    Настройки даты и повторения
                                </button>
                                <AnimatePresence>
                                    {isMobileSettingsOpen && (
                                        <motion.div 
                                            className={styles.mobileSettings}
                                            initial={{ y: '100%' }}
                                            animate={{ y: 0 }}
                                            exit={{ y: '100%' }}
                                            transition={{ type: 'spring', damping: 30 }}
                                        >
                                            <div className={styles.dateTimeSection}>
                                                <div className={styles.datePickerWrapper}>
                                                    <h3 className={styles.sectionTitle}>Дата и время</h3>
                                                    <DatePicker 
                                                        value={selectedDate}
                                                        onChange={handleDateChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className={styles.repeatSection}>
                                                <RepeatSettings
                                                    repeatType={repeatType}
                                                    selectedWeekdays={selectedWeekdays}
                                                    monthDay={monthDay}
                                                    onRepeatTypeChange={handleRepeatTypeChange}
                                                    onWeekdayChange={(day) => {
                                                        setSelectedWeekdays(prev => {
                                                            if (prev.includes(day)) {
                                                                return prev.filter(d => d !== day);
                                                            }
                                                            return [...prev, day].sort((a, b) => a - b);
                                                        });
                                                    }}
                                                    onMonthDayChange={setMonthDay}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default CreateEvent; 