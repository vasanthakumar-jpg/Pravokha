import { PrismaClient } from '@prisma/client';

/**
 * IDatabaseContract
 * 
 * This interface defines the expected structure of the database infrastructure.
 * By depending on this contract, the domain logic remains decoupled from the
 * specific ORM implementation (Prisma).
 */
export interface IDatabaseContract {
    prisma: PrismaClient;
    // Future expansion: 
    // connect(): Promise<void>;
    // disconnect(): Promise<void>;
}

export type DatabaseClient = PrismaClient;
