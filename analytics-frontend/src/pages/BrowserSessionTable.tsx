import React, { useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    ColumnDef,
    flexRender,
    PaginationState, SortingState,
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
import { format } from 'date-fns';

type FetchParams = {
    pageIndex: number;
    pageSize: number;
    roomInstanceId?: string;
    homeURL?: string;
    startedAt_gte?: string;
    startedAt_lte?: string;
    sorting: { id: string; desc: boolean }[];
};

const fetchSessions = async ({ pageIndex, pageSize, roomInstanceId, homeURL, startedAt_gte, startedAt_lte, sorting }: FetchParams) => {
    const params = new URLSearchParams({ page: (pageIndex + 1).toString(), limit: pageSize.toString() });
    if (roomInstanceId) params.append('roomInstanceId', roomInstanceId);
    if (homeURL) params.append('homeURL', homeURL);
    if (startedAt_gte) params.append('startedAt_gte', startedAt_gte);
    if (startedAt_lte) params.append('startedAt_lte', startedAt_lte);

    // Add sorting parameters to the request
    if (sorting.length > 0) {
        const { id, desc } = sorting[0]; // Handle sorting for one column at a time
        params.append('sort', id);
        params.append('order', desc ? 'desc' : 'asc');
    }

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

type BrowserSessionTableProps = {
    filters: {
        roomInstanceId: string;
        homeURL: string;
        startedAt_gte: string;
        startedAt_lte: string;
    };
};

const BrowserSessionTable: React.FC<BrowserSessionTableProps> = ({ filters }) => {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    // State to manage sorting
    const [sorting, setSorting] = useState<SortingState>([]);

    const queryInfo = useQuery({
        queryKey: ['browser-sessions', pagination, filters, sorting],
        queryFn: () => fetchSessions({
            ...pagination,
            ...filters,
            sorting,
        }),
        placeholderData: true,
        refetchOnWindowFocus: false,
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
                cell: info => {
                    const dateValue = info.getValue() as string | number | Date;
                    return format(new Date(dateValue), 'yyyy-MM-dd HH:mm:ss');
                },
                sortingFn: 'datetime',
            },
            {
                accessorKey: 'endedAt',
                header: 'Ended At',
                cell: info => {
                    const dateValue = info.getValue();
                    return dateValue ? format(new Date(dateValue as string | number | Date), 'yyyy-MM-dd HH:mm:ss') : '';
                },
                sortingFn: 'datetime',
            },
            {
                accessorKey: 'homeURL',
                header: 'Home URL',
                cell: info => info.getValue(),
                sortingFn: 'basic',
            },
            {
                accessorKey: 'totalInteractions',
                header: 'Interactions',
                cell: info => info.getValue(),
                sortingFn: 'basic',
            },
            {
                accessorKey: 'totalNavigations',
                header: 'Navigations',
                cell: info => info.getValue(),
                sortingFn: 'basic',
            },
            {
                accessorKey: 'coords',
                header: 'Coords',
                cell: info => info.getValue(),
                sortingFn: 'basic',
            },
            {
                accessorKey: 'usersInteracted',
                header: 'Users Interacted',
                cell: info => info.getValue(),
                sortingFn: 'basic',
            }
        ],
        []
    );

    const table = useReactTable({
        data: sessions,
        columns,
        pageCount: Math.ceil(data?.total / pagination.pageSize) ?? -1,
        state: {
            pagination,
            sorting,
        },
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualSorting: true, // Enable manual sorting (server-side)
        manualPagination: true, // Enable manual pagination (server-side)
        debugTable: true,
    });

    if (isLoading) return <div>Loading...</div>;
    if (error instanceof Error) return <div><span style={{ color: "red" }}>Error: {error.message}</span></div>;

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
                onPageChange={(_, newPage) => setPagination(old => ({ ...old, pageIndex: newPage }))}
                onRowsPerPageChange={event => setPagination(old => ({ ...old, pageSize: Number(event.target.value) }))}
            />
        </TableContainer>
    );
};

export default BrowserSessionTable;
