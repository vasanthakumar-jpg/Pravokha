import { Role } from '@prisma/client';

declare module 'express' {
    interface Request {
        user?: {
            id: string;
            role: Role;
            email: string;
            name?: string;
            phone?: string | null;
            status?: string;
            verificationStatus?: string | null;
            avatarUrl?: string | null;
            bio?: string | null;
            dateOfBirth?: Date | null;
            vendorId?: string | null;
        };
    }
}
