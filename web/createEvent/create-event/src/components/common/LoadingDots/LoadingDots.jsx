import React from 'react';
import { motion } from 'framer-motion';
import styles from './LoadingDots.module.css';

const loadingContainerVariants = {
    start: {
        transition: {
            staggerChildren: 0.2,
            repeat: Infinity
        }
    },
    end: {
        transition: {
            staggerChildren: 0.2,
            repeat: Infinity
        }
    }
};

const loadingCircleVariants = {
    start: {
        y: "0%",
        scale: 1,
        opacity: 1
    },
    end: {
        y: "100%",
        scale: 0.5,
        opacity: 0.2
    }
};

const loadingCircleTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeInOut"
};

const LoadingDots = () => {
    return (
        <div className={styles.loadingContainer}>
            <motion.div
                className={styles.dotsWrapper}
                variants={loadingContainerVariants}
                initial="start"
                animate="end"
            >
                {[...Array(3)].map((_, index) => (
                    <motion.span
                        key={index}
                        className={styles.dot}
                        variants={loadingCircleVariants}
                        transition={loadingCircleTransition}
                    />
                ))}
            </motion.div>
            <motion.div 
                className={styles.loadingText}
                animate={{
                    opacity: [0.5, 1, 0.5],
                    transition: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }
                }}
            >
                Загрузка
            </motion.div>
        </div>
    );
};

export default LoadingDots; 