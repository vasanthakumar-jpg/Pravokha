
import { prisma } from '../../infra/database/client';

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    VERIFICATION = 'VERIFICATION',
    FINANCIAL = 'FINANCIAL'
}

export class AuditService {
    /**
     * Log a sensitive action to the audit_logs table.
     * This is designed to be fire-and-forget or non-blocking where possible.
     */
    static async log(params: {
        actorId?: string;
        targetId?: string;
        targetType: string;
        actionType: AuditAction;
        description?: string;
        metadata?: Record<string, unknown>;
    }) {
        try {
            // PII Redaction Logic
            const sanitizedDescription = this.redactPII(params.description || '');

            await prisma.auditLog.create({
                data: {
                    actorId: params.actorId,
                    targetId: params.targetId,
                    targetType: params.targetType,
                    actionType: params.actionType,
                    description: sanitizedDescription,
                }
            });
        } catch (error) {
            // We console.error but don't throw to avoid crashing the main request flow
            console.error('[AuditService] Failed to record audit log:', error);
        }
    }

    /**
     * Basic redaction for common PII patterns
     */
    private static redactPII(text: string): string {
        // Redact email patterns
        let sanitized = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
        // Redact potential phone numbers (simple 10-digit)
        sanitized = sanitized.replace(/\b\d{10}\b/g, '[REDACTED_PHONE]');
        return sanitized;
    }
}
