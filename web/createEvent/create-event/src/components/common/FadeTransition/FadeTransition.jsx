import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
    hidden: { 
        opacity: 0
    },
    visible: {
        opacity: 1,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.2
        }
    },
    exit: {
        opacity: 0,
        transition: {
            when: "afterChildren",
            staggerChildren: 0.1,
            staggerDirection: -1
        }
    }
};

const itemVariants = {
    hidden: { 
        opacity: 0, 
        y: 20,
        scale: 0.9
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            damping: 12,
            stiffness: 100
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        scale: 0.9,
        transition: {
            duration: 0.3
        }
    }
};

const FadeTransition = ({ children }) => {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <motion.div 
                    className="form-grid"
                    variants={itemVariants}
                >
                    {children}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FadeTransition; 