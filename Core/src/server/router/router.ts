import config from 'config';
import { Router } from 'express';
import yn from 'yn';

import { DisableCache, ExtractHTTPRequestSignature, VerifyData, VerifyEndpoint, VerifyExpiry, VerifyIssuer, ValidateHTTPRequestSignature, ValidateJWKSEndpoint, VerifyMethod } from '@core/server/server';

let router: Router = Router({ mergeParams: true });

router.use('/', DisableCache);

if (yn(config.get('core.secure_mode'), { default: true })) router.use('/', ExtractHTTPRequestSignature, ValidateJWKSEndpoint, ValidateHTTPRequestSignature, VerifyExpiry, VerifyIssuer, VerifyMethod, VerifyEndpoint, VerifyData);

export { router as Router };