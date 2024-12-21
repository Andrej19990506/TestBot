import React from 'react';
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

            <div className={`${styles.repeatOptionsContainer} ${repeatType !== 'none' ? styles.visible : styles.hidden}`}>
                {repeatType === 'weekly' && (
                    <div className={styles.weekdaysSelector}>
                        {weekdays.map(day => (
                            <button
                                key={day.id}
                                className={`${styles.weekdayButton} ${selectedWeekdays.includes(day.id) ? styles.selected : ''}`}
                                onClick={() => onWeekdayChange(day.id)}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                )}

                {repeatType === 'monthly' && (
                    <div className={styles.monthDaySelector}>
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepeatSettings; 