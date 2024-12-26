import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './RepeatSettings.module.css';

const RepeatSettings = ({ 
    repeatType, 
    selectedWeekdays, 
    monthDay, 
    onRepeatTypeChange, 
    onWeekdayChange, 
    onMonthDayChange 
}) => {
    const repeatTypes = [
        { id: 'none', label: 'Не повторять' },
        { id: 'daily', label: 'Каждый день' },
        { id: 'weekly', label: 'Каждую неделю' },
        { id: 'monthly', label: 'Каждый месяц' }
    ];

    const weekdays = [
        { id: 1, label: 'Пн' },
        { id: 2, label: 'Вт' },
        { id: 3, label: 'Ср' },
        { id: 4, label: 'Чт' },
        { id: 5, label: 'Пт' },
        { id: 6, label: 'Сб' },
        { id: 0, label: 'Вс' }
    ];

    const showAdditionalOptions = repeatType === 'weekly' || repeatType === 'monthly';

    return (
        <div className={styles.repeatSettings}>
            <div className={styles.repeatTypeSelector}>
                {repeatTypes.map(type => (
                    <button
                        key={type.id}
                        className={`${styles.repeatTypeButton} ${repeatType === type.id ? styles.selected : ''}`}
                        onClick={() => onRepeatTypeChange(type.id)}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {showAdditionalOptions && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ 
                            height: "auto",
                            opacity: 1,
                            transition: {
                                height: { 
                                    type: "tween",
                                    duration: 0.2,
                                    ease: "easeOut"
                                },
                                opacity: { duration: 0.1 }
                            }
                        }}
                        exit={{ 
                            height: 0,
                            opacity: 0,
                            transition: {
                                height: { 
                                    type: "tween",
                                    duration: 0.2,
                                    ease: "easeIn"
                                },
                                opacity: { duration: 0.1 }
                            }
                        }}
                        style={{ overflow: 'hidden' }}
                        className={styles.additionalOptionsContainer}
                    >
                        <div>
                            {repeatType === 'weekly' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={styles.weekdaysSelector}
                                >
                                    {weekdays.map(day => (
                                        <button
                                            key={day.id}
                                            className={`${styles.weekdayButton} ${selectedWeekdays.includes(day.id) ? styles.selected : ''}`}
                                            onClick={() => onWeekdayChange(day.id)}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {repeatType === 'monthly' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={styles.monthDaySelector}
                                >
                                    <span className={styles.monthDayLabel}>День месяца:</span>
                                    <select
                                        className={styles.monthDaySelect}
                                        value={monthDay || ''}
                                        onChange={(e) => onMonthDayChange(Number(e.target.value))}
                                    >
                                        <option value="">Выберите день</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RepeatSettings; 