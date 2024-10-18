import {PrismaClient} from '@prisma/client';
import dotenv from "dotenv";

dotenv.config();

const prisma = process.env.DATABASE_URL ? new PrismaClient() : null;

const initializeDB = process.env.DATABASE_URL
    ? async () => ({prisma})
    : async () => {
    };

export default initializeDB;

export {prisma};