module.exports = {
    'platform': 'PLATFORM_ID',
    'module': 'MODULE_ID',
    'core': {
        debug: 'CORE_DEBUG',
        secure_mode: 'CORE_SECURE_MODE',
        operations: {
            retry: 'CORE_OPERATIONS_RETRY'
        },
        notifications: {
            signature: 'CORE_NOTIFICATIONS_SIGNATURE'
        }
    },
    'crypto': {
        materials: {
            folder: 'CRYPTO_MATERIALS_FOLDER'
        },
        signing: {
            keys: {
                http: 'CRYPTO_HTTP_SIGNING_KEY',
                track_and_trace: 'TRACK_AND_TRACE_SIGNING_KEY'
            }
        },
        scrypt: {
            key_size: 'CRYPTO_SCRYPT_KEY_SIZE',
            cost: 'CRYPTO_SCRYPT_COST',
            block_size: 'CRYPTO_SCRYPT_BLOCK_SIZE',
        },
        identifier: {
            size: 'CRYPTO_DEFAULT_IDENTIFIER_SIZE'
        },
        jwk: {
            secret: 'CRYPTO_JWK_SECRET'
        }
    },
    'database': {
        host: 'DB_HOST',
        port: 'DB_PORT',
        name: 'DB_NAME',
        user: 'DB_USER',
        password: 'DB_PASSWORD'
    },
    'queue': {
        protocol: 'QUEUE_PROTOCOL',
        host: 'QUEUE_HOST',
        port: 'QUEUE_PORT',
        vhost: 'QUEUE_VHOST',
        user: 'QUEUE_USER',
        password: 'QUEUE_PASSWORD',
        routing_key: 'QUEUE_ROUTING_KEY',
    },
    'server': {
        protocol: 'SERVER_PROTOCOL',
        host: 'SERVER_HOST',
        port: 'SERVER_PORT',
        jwks: 'SERVER_JWKS_ENDPOINT'
    },
    'gateway': {
        identifier: 'GATEWAY_IDENTIFIER',
        protocol: 'GATEWAY_PROTOCOL',
        host: 'GATEWAY_HOST',
        port: 'GATEWAY_PORT',
        jwks: 'GATEWAY_JWKS_ENDPOINT',
        api: 'GATEWAY_API_ENDPOINT'
    },
    'track-and-trace': {
        storage: {
            data: 'TT_STORAGE_DATA',
            options: 'TT_STORAGE_OPTIONS',
            verifications: 'TT_STORAGE_VERIFICATIONS',
            traces: 'TT_STORAGE_TRACES'
        }
    }
};