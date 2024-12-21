import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MobileLayout.module.css';
import TextArea from '../common/Textarea/TextArea';
import DatePicker from '../DatePicker';
import RepeatSettings from '../RepeatSettings';
import NotificationItem from '../notifications/EventNotifications/NotificationItem';
import { AddNotificationButton } from '../notifications/EventNotifications/NotificationButton';
import ChatSelector from '../ChatSelector';
import StepIndicator from './StepIndicator';
import StepNavigation from './StepNavigation';
import DescriptionStep from './steps/DescriptionStep';
import DateTimeStep from './steps/DateTimeStep';
import RepeatStep from './steps/RepeatStep';
import NotificationStep from './steps/NotificationStep';
import ChatsStep from './steps/ChatsStep';

const steps = [
    { id: 1, title: 'Описание' },
    { id: 2, title: 'Дата и время' },
    { id: 3, title: 'Повторение' },
    { id: 4, title: 'Уведомления' },
    { id: 5, title: 'Выбор чатов' }
];

const slideVariants = {
    enter: (direction) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction) => ({
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0
    })
};

const MobileLayout = ({
    description,
    selectedDate,
    repeatType,
    selectedWeekdays,
    monthDay,
    notification,
    selectedChats,
    isAddingNotification: initialIsAddingNotification,
    currentNotification: initialCurrentNotification,
    onDescriptionChange,
    onDateChange,
    onRepeatTypeChange,
    onWeekdayChange,
    onMonthDayChange,
    onNotificationUpdate,
    onNotificationDelete,
    onChatSelect,
    onAddNotification,
    onSaveNotification
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isAddingNotification, setIsAddingNotification] = useState(initialIsAddingNotification);
    const [currentNotification, setCurrentNotification] = useState(initialCurrentNotification);
    const [[page, direction], setPage] = useState([0, 0]);

    const paginate = useCallback((newDirection) => {
        if (currentStep + newDirection > 0 && currentStep + newDirection <= steps.length) {
            setPage([page + newDirection, newDirection]);
            setCurrentStep(prev => prev + newDirection);
        }
    }, [currentStep, page]);

    const handleNotificationAdd = useCallback(() => {
        const newNotification = {
            id: Date.now(),
            time: 5,
            message: ''
        };
        setCurrentNotification(newNotification);
        setIsAddingNotification(true);
    }, []);

    const handleNotificationSave = useCallback(() => {
        if (!currentNotification?.message?.trim()) {
            setIsAddingNotification(false);
            setCurrentNotification(null);
            return;
        }
        onNotificationUpdate(currentNotification);
        setIsAddingNotification(false);
        setCurrentNotification(null);
    }, [currentNotification, onNotificationUpdate]);

    const renderStepContent = useCallback(() => {
        switch (currentStep) {
            case 1:
                return (
                    <DescriptionStep 
                        value={description}
                        onChange={onDescriptionChange}
                    />
                );
            case 2:
                return (
                    <DateTimeStep 
                        value={selectedDate}
                        onChange={onDateChange}
                    />
                );
            case 3:
                return (
                    <RepeatStep
                        repeatType={repeatType}
                        selectedWeekdays={selectedWeekdays}
                        monthDay={monthDay}
                        onRepeatTypeChange={onRepeatTypeChange}
                        onWeekdayChange={onWeekdayChange}
                        onMonthDayChange={onMonthDayChange}
                    />
                );
            case 4:
                return (
                    <NotificationStep
                        notification={notification}
                        isAddingNotification={isAddingNotification}
                        currentNotification={currentNotification}
                        onUpdate={onNotificationUpdate}
                        onDelete={onNotificationDelete}
                        onAdd={handleNotificationAdd}
                        onSave={handleNotificationSave}
                        onCurrentUpdate={(field, value) => 
                            setCurrentNotification(prev => ({
                                ...prev,
                                [field]: value
                            }))
                        }
                        onCurrentDelete={() => {
                            setIsAddingNotification(false);
                            setCurrentNotification(null);
                        }}
                    />
                );
            case 5:
                return (
                    <ChatsStep 
                        selectedChats={selectedChats}
                        onChatSelect={onChatSelect}
                    />
                );
            default:
                return null;
        }
    }, [
        currentStep,
        description,
        selectedDate,
        repeatType,
        selectedWeekdays,
        monthDay,
        notification,
        currentNotification,
        isAddingNotification,
        selectedChats,
        // ... остальные зависимости
    ]);

    const handleStepClick = useCallback((stepId) => {
        const direction = stepId > currentStep ? 1 : -1;
        setPage([page + direction, direction]);
        setCurrentStep(stepId);
    }, [currentStep, page]);

    const stepContent = useMemo(() => renderStepContent(), [renderStepContent]);

    return (
        <div className={styles.mobileLayout}>
            <StepIndicator 
                steps={steps}
                currentStep={currentStep}
                onStepClick={handleStepClick}
            />

            <motion.div 
                className={styles.stepTitle}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {steps.find(s => s.id === currentStep)?.title}
            </motion.div>

            <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    className={styles.stepContent}
                >
                    {stepContent}
                </motion.div>
            </AnimatePresence>

            <StepNavigation 
                currentStep={currentStep}
                totalSteps={steps.length}
                onPrevClick={() => paginate(-1)}
                onNextClick={() => paginate(1)}
            />
        </div>
    );
};

export default MobileLayout; 