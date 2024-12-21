import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './TextArea.module.css';

const TextArea = ({ 
    value, 
    onChange,
    maxLength = 1000 
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderDots, setPlaceholderDots] = useState('...');
    const charCount = value?.length || 0;
    const charCountWarning = charCount > maxLength * 0.9;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    // Анимация точек в плейсхолдере
    useEffect(() => {
        if (!value) {
            const interval = setInterval(() => {
                setPlaceholderDots(prev => {
                    switch (prev) {
                        case '...': return '.';
                        case '.': return '..';
                        case '..': return '...';
                        default: return '...';
                    }
                });
            }, 500);
            return () => clearInterval(interval);
        }
    }, [value]);

    const placeholder = `Опишите ваше событие${placeholderDots}`;

    return (
        <div className={styles.wrapper}>
            <motion.div 
                className={`${styles.textareaContainer} ${isFocused ? styles.focused : ''}`}
                animate={{ 
                    scale: isFocused ? 1.01 : 1,
                    boxShadow: isFocused 
                        ? '0 4px 20px rgba(0, 0, 0, 0.1)' 
                        : '0 2px 10px rgba(0, 0, 0, 0.05)'
                }}
                transition={{ duration: 0.2 }}
            >
                <textarea
                    className={styles.textarea}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
                <AnimatePresence>
                    <motion.div 
                        className={`${styles.charCounter} ${charCountWarning ? styles.warning : ''}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                            opacity: charCount > 0 ? 1 : 0,
                            y: 0,
                            color: charCountWarning ? 'var(--error-color)' : 'var(--gray-dark)'
                        }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {charCount}/{maxLength}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default TextArea; 