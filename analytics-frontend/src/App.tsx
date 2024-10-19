import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BrowserSessions from './pages/BrowserSessions';

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browser-sessions" element={<BrowserSessions />} />
        </Routes>
    );
};

export default App;