import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.copyright}>
                    © {new Date().getFullYear()} Event Manager. Все права защищены.
                </div>
                <div className={styles.links}>
                    <a href="/privacy" className={styles.link}>Конфиденциальность</a>
                    <a href="/terms" className={styles.link}>Условия использования</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 