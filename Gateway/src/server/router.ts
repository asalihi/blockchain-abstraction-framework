import config from 'config';

import { Router } from 'express';

import { KeyStore, UnprotectedEndpoints, ProtectedEndpoints, DataManagerEndpoints, TrackAndTraceEndpoints, MongoDBStorageEndpoints, ModuleManagerEndpoints, WebAuthentication, WebSession, APIAuthentication, APISession } from '@service/server/endpoints/endpoints';
import { CheckIfWebUserIsAuthenticated, DisableCache, HandleNotFound, ValidateRefreshToken, ValidateAccessToken, ExtractHTTPRequestSignature, VerifyData, VerifyEndpoint, VerifyExpiry, VerifyIssuer, ValidateHTTPRequestSignature, ValidateJWKSEndpoint, VerifyMethod } from '@service/server/middlewares/middlewares';

const router: Router = Router({ mergeParams: true });

const WEB_ENDPOINT: string = config.get('server.endpoints.web');
const API_ENDPOINT: string = config.get('server.endpoints.api');
const INTERNAL_ENDPOINT: string = config.get('server.endpoints.internal');

router.use('/.well-known/jwks.json', KeyStore);
router.use(`/:endpoint(${WEB_ENDPOINT}|${API_ENDPOINT}|${INTERNAL_ENDPOINT})`, DisableCache);
router.use(`/:endpoint(${WEB_ENDPOINT}|${API_ENDPOINT}|${INTERNAL_ENDPOINT})`, UnprotectedEndpoints);
router.use(`/:endpoint(${WEB_ENDPOINT})`, WebAuthentication);
router.use(`/:endpoint(${API_ENDPOINT})`, APIAuthentication);
router.use(`/:endpoint(${INTERNAL_ENDPOINT})`, ExtractHTTPRequestSignature, ValidateJWKSEndpoint, ValidateHTTPRequestSignature, VerifyExpiry, VerifyIssuer, VerifyMethod, VerifyEndpoint, VerifyData);
router.use(`/:endpoint(${WEB_ENDPOINT})`, CheckIfWebUserIsAuthenticated);
router.use(`/:endpoint(${WEB_ENDPOINT})/session`, WebSession, HandleNotFound);
router.use(`/:endpoint(${API_ENDPOINT})/session`, ValidateRefreshToken, APISession, HandleNotFound);
router.use(`/:endpoint(${API_ENDPOINT})`, ValidateAccessToken);
router.use(`/:endpoint(${WEB_ENDPOINT}|${API_ENDPOINT}|${INTERNAL_ENDPOINT})`, ProtectedEndpoints);
router.use(`/:endpoint(${WEB_ENDPOINT}|${API_ENDPOINT}|${INTERNAL_ENDPOINT})/modules`, ModuleManagerEndpoints);
router.use(`/:endpoint(${WEB_ENDPOINT}|${API_ENDPOINT}|${INTERNAL_ENDPOINT})/data-manager`, DataManagerEndpoints);
router.use(`/:endpoint(${WEB_ENDPOINT}|${API_ENDPOINT}|${INTERNAL_ENDPOINT})/track-and-trace`, TrackAndTraceEndpoints);
router.use(`/:endpoint(${WEB_ENDPOINT}|${API_ENDPOINT}|${INTERNAL_ENDPOINT})/mongodb-storage`, MongoDBStorageEndpoints);

export { router as Router };