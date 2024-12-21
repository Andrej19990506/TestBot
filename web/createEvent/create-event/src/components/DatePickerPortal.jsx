import React from 'react';
import ReactDOM from 'react-dom';
import styles from './DatePicker.module.css';

const DatePickerPortal = ({ children }) => {
    const [portalNode] = React.useState(() => document.createElement('div'));

    React.useEffect(() => {
        portalNode.className = styles.datepickerPortal;
        document.body.appendChild(portalNode);
        
        return () => {
            document.body.removeChild(portalNode);
        };
    }, [portalNode]);

    return ReactDOM.createPortal(children, portalNode);
};

export default DatePickerPortal; 