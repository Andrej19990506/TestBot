import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button/Button';
import styles from './MobileLayout.module.css';
import PropTypes from 'prop-types';

const steps = [
    { id: 1, title: 'Описание', subtitle: 'Добавьте описание события' },
    { id: 2, title: 'Дата и время', subtitle: 'Выберите дату и время' },
    { id: 3, title: 'Повторение', subtitle: 'Настройте повторение' },
    { id: 4, title: 'Уведомления', subtitle: 'Добавьте уведомления' },
    { id: 5, title: 'Выбор чатов', subtitle: 'Выберите чаты для отправки' }
];

const MobileLayout = ({ children, currentStep, onStepChange, isLoading, canProceed, onSubmit }) => {
    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            onStepChange(currentStep - 1);
        }
    }, [currentStep, onStepChange]);

    const handleNext = useCallback(() => {
        if (currentStep === steps.length) {
            onSubmit?.();
        } else if (currentStep < steps.length) {
            onStepChange(currentStep + 1);
        }
    }, [currentStep, onStepChange, onSubmit]);

    return (
        <div className={styles.mobileLayout}>
            <div className={styles.stepIndicator}>
                {steps.map((step) => (
                    <motion.div
                        key={step.id}
                        className={`${styles.stepDot} ${currentStep === step.id ? styles.active : ''}`}
                        onClick={() => onStepChange(step.id)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                    />
                ))}
            </div>

            <div className={styles.stepTitleContainer}>
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={`title-${currentStep}`}
                        className={styles.stepTitle}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                    >
                        <h2>{steps[currentStep - 1]?.title}</h2>
                        <p className={styles.stepSubtitle}>
                            {steps[currentStep - 1]?.subtitle}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className={styles.mainContainer}>
                <div className={styles.navigation}>
                    <Button
                        variant="secondary"
                        onClick={handleBack}
                        disabled={currentStep === 1 || isLoading}
                        className={styles.prevButton}
                    >
                        Назад
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleNext}
                        disabled={!canProceed || isLoading}
                        className={styles.nextButton}
                    >
                        {currentStep === steps.length ? 'Создать' : 'Далее'}
                    </Button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div 
                        key={`content-${currentStep}`}
                        className={styles.contentContainer}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                    >
                        <div className={styles.contentWrapper}>
                            {children}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

MobileLayout.propTypes = {
    children: PropTypes.node.isRequired,
    currentStep: PropTypes.number.isRequired,
    onStepChange: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    canProceed: PropTypes.bool,
    onSubmit: PropTypes.func
};

export default MobileLayout; 