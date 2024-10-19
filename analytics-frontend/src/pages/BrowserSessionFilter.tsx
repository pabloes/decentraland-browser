import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

type FilterProps = {
    onFiltersChange: (filters: { roomInstanceId: string; startedAt_gte: string; startedAt_lte: string }) => void;
};

const BrowserSessionFilter: React.FC<FilterProps> = ({ onFiltersChange }) => {
    const [filterInput, setFilterInput] = useState<string>('');
    const [startedAt_gte, setStartedAt_gte] = useState<string>('');
    const [startedAt_lte, setStartedAt_lte] = useState<string>('');

    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            onFiltersChange({
                roomInstanceId: filterInput,
                startedAt_gte,
                startedAt_lte,
            });
        }, 500);

        return () => clearTimeout(debounceTimeout);
    }, [filterInput, startedAt_gte, startedAt_lte, onFiltersChange]);

    return (
        <Box p={2} display="flex" alignItems="center">
            <TextField
                variant="standard"
                size="small"
                value={filterInput}
                onChange={e => setFilterInput(e.target.value)}
                placeholder="Filter by Room Instance ID"
                style={{ marginBottom: '10px', marginRight: '10px', width: '200px' }}
            />
            <TextField
                variant="standard"
                size="small"
                type="date"
                value={startedAt_gte}
                onChange={e => setStartedAt_gte(e.target.value)}
                label="From"
                InputLabelProps={{ shrink: true }}
                style={{ marginBottom: '10px', marginRight: '10px' }}
            />
            <TextField
                variant="standard"
                size="small"
                type="date"
                value={startedAt_lte}
                onChange={e => setStartedAt_lte(e.target.value)}
                label="To"
                InputLabelProps={{ shrink: true }}
                style={{ marginBottom: '10px' }}
            />
        </Box>
    );
};

export default BrowserSessionFilter;