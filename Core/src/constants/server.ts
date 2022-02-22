import config from 'config';

export const GATEWAY_ENDPOINT: string = `${config.get('gateway.protocol')}://${config.get('gateway.host')}:${config.get('gateway.port')}`;
export const GATEWAY_JWKS_ENDPOINT: string = config.get('gateway.jwks');
export const GATEWAY_FULL_JWKS_ENDPOINT: string = `${GATEWAY_ENDPOINT}${GATEWAY_JWKS_ENDPOINT}`;
export const SERVER_ENDPOINT: string = `${config.get('server.protocol')}://${config.get('server.host')}:${config.get('server.port')}`;
export const HTTP_REQUEST_SUPPORTED_METHOD_VALUES: string[] = ['GET', 'POST'];