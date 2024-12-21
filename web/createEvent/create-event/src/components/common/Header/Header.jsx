import React from 'react';
import Navigation from '../../Navigation/Navigation';
import styles from './Header.module.css';

const Header = () => {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    Event Manager
                </div>
                <Navigation />
            </div>
        </header>
    );
};

export default Header; 