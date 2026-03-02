import { OAuth2Client } from 'google-auth-library';
import { config } from '../../core/config/env';

const client = new OAuth2Client(config.google.clientId);

export class GoogleAuthService {
    static async verifyToken(idToken: string) {
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: config.google.clientId,
            });
            const payload = ticket.getPayload();

            if (!payload) {
                throw new Error('Invalid Google token');
            }

            return {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                email_verified: payload.email_verified,
            };
        } catch (error) {
            console.error('Google verification error:', error);
            throw new Error('Google authentication failed');
        }
    }
}
