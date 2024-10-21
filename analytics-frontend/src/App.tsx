import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BrowserSessions from './pages/BrowserSessions';

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<BrowserSessions />} />
        </Routes>
    );
};

export default App;