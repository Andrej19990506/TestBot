import React from 'react';
import EventItem from './EventItem';

function EventList({ events, onDeleteEvent }) {
  return (
    <div className="event-list">
      {events.map(event => (
        <EventItem key={event.id} event={event} onDelete={onDeleteEvent} />
      ))}
    </div>
  );
}

export default EventList;
