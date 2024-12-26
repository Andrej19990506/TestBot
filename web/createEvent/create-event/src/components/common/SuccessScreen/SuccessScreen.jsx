import React from 'react';
import { motion } from 'framer-motion';
import styles from './SuccessScreen.module.css';

const SuccessScreen = () => {
    return (
        <div className={styles.container}>
            <motion.div 
                className={styles.circle}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                }}
            >
                <motion.svg 
                    width="48" 
                    height="48" 
                    viewBox="0 0 48 48"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <motion.path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 24l8 8 12-16"
                    />
                </motion.svg>
            </motion.div>
        </div>
    );
};

export default SuccessScreen; 