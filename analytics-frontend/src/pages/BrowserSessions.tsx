import React, { useState } from 'react';
import BrowserSessionFilter from './BrowserSessionFilter';
import BrowserSessionTable from './BrowserSessionTable';
import {useQuery} from "@tanstack/react-query";
import {CardHeader, Stack, Typography} from "@mui/material";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const BrowserSessions: React.FC = () => {
    const queryInfo = useQuery({
        queryKey: ['summary'],
        queryFn: () => fetchSummary(),
        placeholderData: true,
        refetchOnWindowFocus: false,
    });
    const { data, error, isLoading } = queryInfo;

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

            <div>
                {isLoading?`Loading summary...`:``}
                <Stack direction="row" spacing={2}>
                    <Card>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                Sessions
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                                {data.sessions}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                Users
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                                {data.users}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                Navigations
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                                {data.navigations}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                Interactions
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                                {data.interactions}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                Locations
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                                {data.locations}
                            </Typography>
                        </CardContent>
                    </Card>
                </Stack>
            </div>
            <BrowserSessionFilter onFiltersChange={handleFiltersChange} />
            <BrowserSessionTable filters={filters} />
        </div>
    );
};

export default BrowserSessions;

async function fetchSummary(){
    return await fetch(`/api/summary`).then(r=>r.json())
}