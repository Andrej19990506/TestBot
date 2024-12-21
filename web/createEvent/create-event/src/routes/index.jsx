import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import CreateEvent from '../components/CreateEvent';
import EventList from '../components/EventList';
import Navigation from '../components/Navigation';

function AppRoutes() {
    const location = useLocation();

    return (
        <>
            <Navigation />
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<CreateEvent />} />
                    <Route path="/events" element={<EventList />} />
                </Routes>
            </AnimatePresence>
        </>
    );
}

export default AppRoutes; 