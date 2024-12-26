import React from 'react';
import styles from './TextArea.module.css';

const TextArea = ({ value, onChange, placeholder, error }) => {
    return (
        <div className={`${styles.textareaWrapper} ${error ? styles.error : ''}`}>
            <textarea
                className={styles.textarea}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                maxLength={1000}
            />
            {error && <div className={styles.errorText}>{error}</div>}
            <div className={styles.counter}>
                {value.length}/1000
            </div>
        </div>
    );
};

export default TextArea; 