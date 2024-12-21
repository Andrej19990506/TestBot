import React from 'react';
import styles from './DatePicker.module.css';
import AirDatepicker from 'air-datepicker';
import 'air-datepicker/air-datepicker.css';
import '../styles/air-datepicker-custom.css';
import localeRu from 'air-datepicker/locale/ru';
import anime from 'animejs';

const DatePicker = ({ value, onChange }) => {
    const inputRef = React.useRef(null);
    const datepickerRef = React.useRef(null);
    const animationRef = React.useRef(null);
    const containerRef = React.useRef(null);
    
    const [inputValue, setInputValue] = React.useState('');
    const [isInvalid, setIsInvalid] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');

    console.log('DatePicker initialized with value:', value);

    const cleanupDatepicker = () => {
        if (animationRef.current) {
            animationRef.current.pause();
            animationRef.current = null;
        }
        
        try {
            if (datepickerRef.current) {
                datepickerRef.current.destroy();
                datepickerRef.current = null;
            }
        } catch (error) {
            console.warn('Error destroying datepicker:', error);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    const validateDate = (date) => {
        const now = new Date();
        const selectedDate = new Date(date);
        
        if (selectedDate < now) {
            setIsInvalid(true);
            setErrorMessage('Выберите будущую дату и время');
            return false;
        }
        
        setIsInvalid(false);
        setErrorMessage('');
        return true;
    };

    const handleDateSelect = (date) => {
        const formattedDate = formatDate(date);
        if (validateDate(date)) {
            onChange(formattedDate);
        }
        setInputValue(formattedDate);
    };

    const initializeDatepicker = () => {
        if (!inputRef.current || !containerRef.current || datepickerRef.current) return;

        datepickerRef.current = new AirDatepicker(inputRef.current, {
            locale: localeRu,
            timepicker: true,
            dateFormat: formatDate,
            isMobile: false,
            autoClose: false,
            toggleSelected: false,
            keyboardNav: false,
            visible: false,
            classes: isInvalid ? '-invalid-' : '',
            onSelect: ({ date }) => {
                if (date) {
                    handleDateSelect(date);
                }
                if (datepickerRef.current) {
                    datepickerRef.current.show();
                }
                return false;
            },
            onChangeTime: (hour, minute) => {
                if (datepickerRef.current) {
                    const currentDate = datepickerRef.current.selectedDates[0];
                    if (currentDate) {
                        currentDate.setHours(hour);
                        currentDate.setMinutes(minute);
                        handleDateSelect(currentDate);
                    }
                    datepickerRef.current.show();
                }
                return false;
            },
            onBeforeHide: () => false,
            onHide: () => false,
            container: containerRef.current,
            prevHtml: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 15L7 10L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            nextHtml: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8 15L13 10L8 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`
        });

        if (value) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    datepickerRef.current.selectDate(date);
                    setInputValue(value);
                }
            } catch (error) {
                console.warn('Error setting initial date:', error);
            }
        }
    };

    React.useEffect(() => {
        initializeDatepicker();
        return () => cleanupDatepicker();
    }, []);

    React.useEffect(() => {
        if (!datepickerRef.current || !value) return;
        
        try {
            const date = new Date(value.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$2-$1'));
            if (!isNaN(date.getTime())) {
                datepickerRef.current.selectDate(date);
                setInputValue(value);
            }
        } catch (error) {
            console.warn('Error updating date:', error);
        }
    }, [value]);

    React.useEffect(() => {
        if (datepickerRef.current) {
            datepickerRef.current.$datepicker.classList.toggle('-invalid-', isInvalid);
        }
    }, [isInvalid]);

    return (
        <div className={styles.datepickerWrapper}>
            <input
                ref={inputRef}
                type="text"
                className={`${styles.datepickerInput} ${isInvalid ? styles.invalid : ''}`}
                value={inputValue}
                readOnly
                placeholder="Выберите дату и время"
            />
            <span className={`${styles.datepickerIcon} ${isInvalid ? styles.invalidIcon : ''}`}>
                <svg viewBox="0 0 24 24" width="20" height="20" className={styles.iconSvg}>
                    <path d="M19 4h-1V3c0-.6-.4-1-1-1s-1 .4-1 1v1H8V3c0-.6-.4-1-1-1s-1 .4-1 1v1H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                </svg>
            </span>
            {isInvalid && <div className={styles.errorMessage}>{errorMessage}</div>}
            <div ref={containerRef} className={styles.datepickerContainer} />
        </div>
    );
};

export default DatePicker; 