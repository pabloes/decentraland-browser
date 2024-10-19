import React, { useMemo } from 'react';
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
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

// Mocking a data fetcher
type FetchParams = {
    pageIndex: number;
    pageSize: number;
};

const fetchSessions = async ({ pageIndex, pageSize }: FetchParams) => {
    const response = await fetch(`/api/browser-sessions?page=${pageIndex + 1}&limit=${pageSize}`); // page is 1-indexed
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
};

type BrowserSession = {
    id: number;
    roomInstanceId: string;
    startedAt: string;  // ISO string
    endedAt?: string;  // ISO string or null
    homeURL: string;
    // Removed width and height
};

const BrowserSessions: React.FC = () => {
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const queryInfo = useQuery({
        queryKey: ['browser-sessions', pagination],
        queryFn: () => fetchSessions(pagination),
        keepPreviousData: true,
    });

    const { data, error, isLoading } = queryInfo;

    // Destructuring data from API response
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
                cell: info => new Date(info.getValue() as string).toLocaleString(),
                sortingFn: 'datetime',
            },
            {
                accessorKey: 'endedAt',
                header: 'Ended At',
                cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleString() : '',
                sortingFn: 'datetime',
            },
            {
                accessorKey: 'homeURL',
                header: 'Home URL',
                cell: info => info.getValue(),
                sortingFn: 'basic',
            },
        ],
        []
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