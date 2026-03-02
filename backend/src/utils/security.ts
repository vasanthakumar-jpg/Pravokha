import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

/**
 * Basic OSINT Utility for email/domain checks.
 * Checks if the domain has valid MX records to prevent dummy emails.
 */
export class SecurityUtils {
    static async validateEmailDomain(email: string): Promise<boolean> {
        try {
            const domain = email.split('@')[1];
            if (!domain) return false;

            const mxRecords = await resolveMx(domain);
            return mxRecords && mxRecords.length > 0;
        } catch (error) {
            console.error(`DNS lookup failed for email domain: ${email}`, error);
            // In case of network errors or timeouts, we might want to allow it 
            // but log it for investigation. For strictness, return false.
            return false;
        }
    }

    /**
     * Checks if a domain is associated with known temporary email providers.
     * (Basic hardcoded list, in production use an API or larger list)
     */
    static isDisposableEmail(email: string): boolean {
        const disposableDomains = [
            'mailinator.com',
            'tempmail.com',
            'guerrillamail.com',
            '10minutemail.com'
        ];
        const domain = email.split('@')[1].toLowerCase();
        return disposableDomains.includes(domain);
    }
}
