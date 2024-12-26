import React from 'react';
import { motion } from 'framer-motion';
import styles from './Badge.module.css';

const Badge = ({ type, isActive, lastCheck }) => {
    console.log('Badge props:', { type, isActive, lastCheck });

    const repeatIcons = {
        daily: (
            <motion.svg 
                className={styles.icon}
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                <motion.path 
                    d="M12 6v6l4 2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.path
                    d="M21 12a9 9 0 11-9-9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.svg>
        ),
        weekly: (
            <motion.svg 
                className={styles.icon}
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none"
            >
                <rect 
                    x="3" 
                    y="4" 
                    width="18" 
                    height="16" 
                    rx="2" 
                    strokeWidth="2"
                />
                <path 
                    d="M3 10h18" 
                    strokeWidth="2"
                />
                <motion.circle
                    cx="12"
                    cy="15"
                    r="2"
                    initial={{ scale: 0.5, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                />
            </motion.svg>
        ),
        monthly: (
            <motion.svg 
                className={styles.icon}
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none"
            >
                <rect 
                    x="3" 
                    y="4" 
                    width="18" 
                    height="16" 
                    rx="2" 
                    strokeWidth="2"
                />
                <path 
                    d="M3 10h18" 
                    strokeWidth="2"
                />
                <motion.path
                    d="M12 12v6M9 15h6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                />
            </motion.svg>
        )
    };

    const getTypeLabel = (type) => {
        switch(type) {
            case 'daily': return 'Ежедневно';
            case 'weekly': return 'Еженедельно';
            case 'monthly': return 'Ежемесячно';
            default: return '';
        }
    };

    return (
        <motion.div 
            className={`${styles.badge} ${isActive ? styles.active : styles.inactive}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={lastCheck ? `Последняя проверка: ${new Date(lastCheck).toLocaleTimeString('ru-RU')}` : ''}
        >
            <div className={styles.iconWrapper}>
                {repeatIcons[type]}
            </div>
            <span className={styles.label}>{getTypeLabel(type)}</span>
        </motion.div>
    );
};

export default Badge; 