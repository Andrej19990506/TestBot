import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './ErrorScreen.module.css';
import { fireConfetti } from '../../../utils/confetti';

const iconVariants = {
    initial: { 
        scale: 1,
        rotate: 0 
    },
    animate: {
        scale: [1, 1.2, 1],
        rotate: [0, -15, 15, -15, 0],
        transition: {
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
        }
    }
};

const ErrorScreen = ({ 
    message = 'Сервер временно недоступен', 
    onRetry, 
    retryAttempt = 0,
    maxRetries = 3,
    isRetrying = false 
}) => {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        let timer;
        if (isRetrying) {
            setCountdown(5);
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isRetrying]);

    const vibrate = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    };

    const handleRetry = () => {
        if (isRetrying || retryAttempt >= maxRetries) return;
        vibrate();
        onRetry();
    };

    return (
        <div className={styles.errorScreen}>
            <motion.div 
                className={styles.errorContainer}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                <motion.div 
                    className={styles.iconWrapper}
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                >
                    <div className={styles.icon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <motion.path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ 
                                    duration: 2,
                                    ease: "easeInOut",
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                }}
                            />
                        </svg>
                    </div>
                </motion.div>
                <motion.h2 
                    className={styles.title}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Упс! Что-то пошло не так
                </motion.h2>
                <motion.p 
                    className={styles.message}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {message}
                </motion.p>
                <motion.button 
                    className={`${styles.retryButton} ${isRetrying ? styles.retrying : ''}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: isRetrying ? 1 : 1.05 }}
                    whileTap={{ scale: isRetrying ? 1 : 0.95 }}
                    onClick={handleRetry}
                    disabled={isRetrying || retryAttempt >= maxRetries}
                >
                    {isRetrying 
                        ? `Повторная попытка через ${countdown}с` 
                        : retryAttempt >= maxRetries 
                            ? 'Слишком много попыток' 
                            : 'Попробовать снова'
                    }
                </motion.button>
                {retryAttempt > 0 && (
                    <div className={styles.retryInfo}>
                        Попытка {retryAttempt} из {maxRetries}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ErrorScreen; 