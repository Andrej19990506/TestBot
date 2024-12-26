import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './OnboardingTour.module.css';

const OnboardingTour = ({ steps, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const audioRef = useRef(null);
    const targetRef = useRef(null);

    useEffect(() => {
        if (steps[currentStep]?.content.audio) {
            audioRef.current = new Audio(`/audio/${steps[currentStep].content.audio}`);
            audioRef.current.addEventListener('loadeddata', () => {
                setAudioLoaded(true);
                // Автоматически воспроизводим аудио при загрузке
                audioRef.current.play();
                setIsPlaying(true);
            });

            // Находим целевой элемент и добавляем подсветку
            const targetElement = document.querySelector(steps[currentStep].element);
            if (targetElement) {
                targetRef.current = targetElement;
                targetElement.classList.add(styles.highlighted);
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeEventListener('loadeddata', () => {});
            }
            if (targetRef.current) {
                targetRef.current.classList.remove(styles.highlighted);
            }
        };
    }, [currentStep, steps]);

    const handleNext = () => {
        // Если аудио еще играет, останавливаем его
        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
            setAudioLoaded(false);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        onComplete();
    };

    return (
        <motion.div 
            className={styles.tourOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentStep}
                    className={styles.contentWrapper}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <div className={styles.content}>
                        <div className={styles.audioIndicator}>
                            {isPlaying && (
                                <motion.div 
                                    className={styles.soundWave}
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                />
                            )}
                        </div>
                        <p className={styles.text}>{steps[currentStep].content.text}</p>
                        <div className={styles.controls}>
                            <button 
                                className={styles.skipButton} 
                                onClick={handleSkip}
                            >
                                Пропустить
                            </button>
                            <button 
                                className={styles.nextButton} 
                                onClick={handleNext}
                                disabled={!audioLoaded}
                            >
                                {currentStep === steps.length - 1 ? 'Завершить' : 'Далее'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

export default OnboardingTour; 