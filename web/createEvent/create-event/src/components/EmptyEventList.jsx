import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './EmptyEventList.module.css';

const EmptyEventList = () => {
    const navigate = useNavigate();

    return (
        <motion.div 
            className={styles.emptyContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div 
                className={styles.content}
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <motion.div 
                    className={styles.iconWrapper}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/create')}
                >
                    <svg 
                        className={styles.icon} 
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <motion.circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1 }}
                        />
                        <motion.path
                            d="M12 8v8M8 12h8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        />
                    </svg>
                </motion.div>
                <motion.p 
                    className={styles.text}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    У вас пока нет событий.<br />
                    Нажмите, чтобы создать первое!
                </motion.p>
            </motion.div>
        </motion.div>
    );
};

export default EmptyEventList; 