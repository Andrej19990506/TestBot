import React from 'react';
import Header from '../common/Header/Header';
import Footer from '../common/Footer/Footer';
import styles from './EventList.module.css';

const EventList = () => {
    return (
        <div className={styles.pageWrapper}>
            <Header />
            <main className={styles.container}>
                <h2 className={styles.title}>Список событий</h2>
                <div className={styles.eventGrid}>
                    {/* Здесь будет список событий */}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default EventList; 