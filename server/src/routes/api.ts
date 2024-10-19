import { Router, Request, Response } from 'express';
import { prisma } from '../database';
import { PrismaClientValidationError } from "@prisma/client/runtime/library";
import { parseISO } from 'date-fns';

export const apiRouter = Router();

interface QueryParams {
    sort?: string;     // Sort fields
    order?: string;    // Sort orders
    page?: string;     // Page number
    limit?: string;    // Items per page
    [key: string]: any; // Other filter fields
}

apiRouter.get('/api/browser-sessions', async (req: Request, res: Response) => {
    const {
        sort,
        order,
        page,
        limit,
        location,
        ...filters
    }: QueryParams = req.query;

    const where: any = {};

    // Build the where clause for filtering
    Object.keys(filters).forEach(key => {
        if (filters[key]) {
            if (key.endsWith('_gte')) {
                const field = key.replace('_gte', '');
                where[field] = {
                    ...where[field], // Preserve existing conditions
                    gte: parseISO(filters[key]),
                };
            } else if (key.endsWith('_lte')) {
                const field = key.replace('_lte', '');
                where[field] = {
                    ...where[field], // Preserve existing conditions
                    lte: parseISO(filters[key]),
                };
            } else {
                where[key] = { contains: filters[key], mode: 'insensitive' };  // Exact match, contains, startsWith, etc.
            }
        }
    });

    // Add location filtering
    if (location) {
        where.locations = {
            some: {
                sceneName: {
                    contains: location,
                    mode: 'insensitive'
                }
            }
        };
    }

    // Build the orderBy clause for sorting
    const orderBy: any[] = [];
    if (sort && order) {
        const sortFields = sort.split(',');
        const sortOrders = order.split(',');
        for (let i = 0; i < sortFields.length; i++) {
            orderBy.push({ [sortFields[i]]: sortOrders[i] === 'desc' ? 'desc' : 'asc' });
        }
    }

    // Handle pagination
    const currentPage = page ? parseInt(page, 10) : 1;
    const pageLimit = limit ? parseInt(limit, 10) : 10;
    const skip = (currentPage - 1) * pageLimit;

    try {
        const browserSessions = await prisma.browserSession.findMany({
            where,
            orderBy,
            skip,
            take: pageLimit,
            include: {
                locations: true,
                interactions: true,
                visitedURLs: true,
            },
        });

        // Optionally, get the total count for pagination purposes
        const totalCount = await prisma.browserSession.count({ where });

        res.json({
            data: browserSessions,
            total: totalCount,
            page: currentPage,
            limit: pageLimit,
        });
    } catch (error) {
        if (error instanceof PrismaClientValidationError && error.message.indexOf("Unknown argument") >= 0) {
            const errorMessageLines = error.message.split(`\n`);
            return res.status(500).send(errorMessageLines[errorMessageLines.length - 1].split(".")[0]);
        }
        console.error(error);
        return res.status(500).send('Server error');
    }
});