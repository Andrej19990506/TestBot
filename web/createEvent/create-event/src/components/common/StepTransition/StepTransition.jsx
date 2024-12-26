import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './StepTransition.module.css';

const StepTransition = ({ children, direction, currentStep }) => {
    const slideVariants = {
        initial: (direction) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        animate: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    return (
        <div className={styles.container}>
            <AnimatePresence 
                mode="wait" 
                initial={false}
                custom={direction}
            >
                <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    className={styles.content}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default StepTransition; 