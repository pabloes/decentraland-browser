import React, { useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    ColumnDef,
    flexRender,
    PaginationState,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TableSortLabel,
    TablePagination,
    TextField,
    Box,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../hooks/useDebounce';  // Ensure correct path to the custom hook
import { format } from 'date-fns';

type FetchParams = {
    pageIndex: number;
    pageSize: number;
    roomInstanceId?: string;
    startedAt_gte?: string;
    startedAt_lte?: string;
};

const fetchSessions = async ({ pageIndex, pageSize, roomInstanceId, startedAt_gte, startedAt_lte }: FetchParams) => {
    const params = new URLSearchParams({ page: (pageIndex + 1).toString(), limit: pageSize.toString() });
    if (roomInstanceId) params.append('roomInstanceId', roomInstanceId);
    if (startedAt_gte) params.append('startedAt_gte', startedAt_gte);
    if (startedAt_lte) params.append('startedAt_lte', startedAt_lte);
    const response = await fetch(`/api/browser-sessions?${params.toString()}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
};

type BrowserSession = {
    id: number;
    roomInstanceId: string;
    startedAt: string;
    endedAt?: string;
    homeURL: string;
};

const BrowserSessions: React.FC = () => {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [filterInput, setFilterInput] = useState<string>('');
    const [startedAt_gte, setStartedAt_gte] = useState<string>('');
    const [startedAt_lte, setStartedAt_lte] = useState<string>('');
    const debouncedRoomInstanceId = useDebounce(filterInput, 500);
    const debouncedDateFrom = useDebounce(startedAt_gte, 500);
    const debouncedDateTo = useDebounce(startedAt_lte, 500);

    const queryInfo = useQuery({
        queryKey: ['browser-sessions', pagination, debouncedRoomInstanceId, debouncedDateFrom, debouncedDateTo],
        queryFn: () => fetchSessions({
            ...pagination,
            roomInstanceId: debouncedRoomInstanceId,
            startedAt_gte: debouncedDateFrom || undefined,
            startedAt_lte: debouncedDateTo || undefined,
        }),
        keepPreviousData: true,
    });

    const { data, error, isLoading } = queryInfo;
    const sessions = data?.data || [];

    const columns = useMemo<ColumnDef<BrowserSession>[]>(
        () => [
            {
                accessorKey: 'id',
                header: 'ID',
                cell: info => info.getValue(),
                sortingFn: 'basic',
            },
            {
                accessorKey: 'roomInstanceId',
                header: 'Room Instance ID',
                cell: info => info.getValue(),
                sortingFn: 'basic',
            },
            {
                accessorKey: 'startedAt',
                header: 'Started At',
                cell: info => format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm:ss'),
                sortingFn: 'datetime',
            },
            {
                accessorKey: 'endedAt',
                header: 'Ended At',
                cell: info => info.getValue() ? format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm:ss') : '',
                sortingFn: 'datetime',
            },
            {
                accessorKey: 'homeURL',
                header: 'Home URL',
                cell: info => info.getValue(),
                sortingFn: 'basic',
            },
        ],
        []  // No dependencies here to avoid re-renders
    );

    const table = useReactTable({
        data: sessions,
        columns,
        pageCount: Math.ceil(data?.total / pagination.pageSize) ?? -1, // Calculate page count from total
        state: {
            pagination,
        },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true, // Enable manual pagination to sync with server
        debugTable: true,
    });

    if (isLoading) return <div>Loading...</div>;
    if (error instanceof Error) return <div>Error: {error.message}</div>;

    return (
        <TableContainer component={Paper}>
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
            <Table>
                <TableHead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <TableCell key={header.id}>
                                    {header.isPlaceholder ? null : (
                                        <>
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getCanSort() && (
                                                <TableSortLabel
                                                    active={!!header.column.getIsSorted()}
                                                    direction={header.column.getIsSorted() === 'asc' ? 'asc' : 'desc'}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                />
                                            )}
                                        </>
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableHead>
                <TableBody>
                    {table.getRowModel().rows.map(row => (
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                component="div"
                count={data?.total ?? 0}
                rowsPerPage={pagination.pageSize}
                page={pagination.pageIndex}
                onPageChange={(event, newPage) => setPagination(old => ({ ...old, pageIndex: newPage }))}
                onRowsPerPageChange={event => setPagination(old => ({ ...old, pageSize: Number(event.target.value) }))}
            />
        </TableContainer>
    );
};

export default BrowserSessions;