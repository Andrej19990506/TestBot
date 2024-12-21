import React from 'react';
import DatePicker from '../../DatePicker';
import styles from '../MobileLayout.module.css';

const DateTimeStep = React.memo(({ value, onChange }) => (
    <div className={styles.datePickerWrapper}>
        <DatePicker 
            value={value}
            onChange={onChange}
        />
    </div>
));

export default DateTimeStep; 