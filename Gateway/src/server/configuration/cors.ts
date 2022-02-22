import cors from 'cors';

import { VerifyCORS } from '@service/server/helpers';

export default cors({
	origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
		if (!origin) callback(null, false);
		else VerifyCORS(origin, callback);
	}, credentials: true
});