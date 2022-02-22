import config from 'config';
import cors = require('cors');

export const CORS_STRATEGY = cors({
	origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
		if (!origin) callback(null, false);
		else VerifyCORS(origin, callback);
	}, credentials: true
});

const AUTHORIZED_ENDPOINTS: string[] = config.get('server.authorized_clients') ?? [];

function VerifyCORS(origin: string, callback: (error: any, success: boolean) => void): void {
    if (AUTHORIZED_ENDPOINTS.includes(origin!)) {
        callback(null, true);
    } else {
        callback(null, false);
    };
}