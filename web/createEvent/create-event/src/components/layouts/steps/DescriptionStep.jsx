import React from 'react';
import TextArea from '../../common/Textarea/TextArea';

const DescriptionStep = React.memo(({ value, onChange }) => (
    <TextArea 
        value={value}
        onChange={onChange}
        placeholder="Опишите ваше событие..."
    />
));

export default DescriptionStep; 