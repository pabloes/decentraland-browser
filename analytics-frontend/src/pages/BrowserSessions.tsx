import React, { useState } from 'react';
import BrowserSessionFilter from './BrowserSessionFilter';
import BrowserSessionTable from './BrowserSessionTable';

const BrowserSessions: React.FC = () => {
    const [filters, setFilters] = useState({
        roomInstanceId: '',
        homeURL: '',
        startedAt_gte: '',
        startedAt_lte: '',
    });

    const handleFiltersChange = (newFilters: { roomInstanceId?: string; homeURL?: string; startedAt_gte?: string; startedAt_lte?: string }) => {
        setFilters({
            roomInstanceId: newFilters.roomInstanceId ?? '',
            homeURL: newFilters.homeURL ?? '',
            startedAt_gte: newFilters.startedAt_gte ?? '',
            startedAt_lte: newFilters.startedAt_lte ?? '',
        });
    };

    return (
        <div>
            <BrowserSessionFilter onFiltersChange={handleFiltersChange} />
            <BrowserSessionTable filters={filters} />
        </div>
    );
};

export default BrowserSessions;