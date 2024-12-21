import React from 'react';
import RepeatSettings from '../../RepeatSettings';

const RepeatStep = React.memo(({ 
    repeatType,
    selectedWeekdays,
    monthDay,
    onRepeatTypeChange,
    onWeekdayChange,
    onMonthDayChange 
}) => (
    <RepeatSettings
        repeatType={repeatType}
        selectedWeekdays={selectedWeekdays}
        monthDay={monthDay}
        onRepeatTypeChange={onRepeatTypeChange}
        onWeekdayChange={onWeekdayChange}
        onMonthDayChange={onMonthDayChange}
    />
));

export default RepeatStep; 