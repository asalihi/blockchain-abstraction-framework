module.exports = {
    platform: 'PLATFORM_ID',
    module: 'MODULE_ID',
    core: {
        debug: 'CORE_DEBUG',
        secure_mode: 'CORE_SECURE_MODE',
        operations: {
            retry: 'CORE_OPERATIONS_RETRY'
        },
        notifications: {
            signature: 'CORE_NOTIFICATIONS_SIGNATURE'
        }
    },
    crypto: {
        materials: {
            folder: 'CRYPTO_CRYPTOGRAPHIC_MATERIALS'
        },
        signing: {
            keys: {
                http: 'CRYPTO_HTTP_SIGNING_KEY',
                jwt: 'CRYPTO_JWT_SIGNING_KEY'
            }
        },
        jwt: {
            refresh: {
                expiration: 'CRYPTO_JWK_REFRESH_EXPIRATION'
            },
            access: {
                expiration: 'CRYPTO_JWK_ACCESS_EXPIRATION'
            },
            authentication: {
                expiration: 'CRYPTO_JWK_AUTHENTICATION_EXPIRATION'
            },
            genesis: 'CRYPTO_GENESIS_TOKEN_ID'
        },
        scrypt: {
            key_size: 'CRYPTO_SCRYPT_KEY_SIZE',
            cost: 'CRYPTO_SCRYPT_COST',
            block_size: 'CRYPTO_SCRYPT_BLOCK_SIZE',
        },
        salt: {
            size: 'CRYPTO_SALT_SIZE'
        },
        identifier: {
            size: 'CRYPTO_DEFAULT_IDENTIFIER_SIZE'
        },
        jwk: {
            secret: 'CRYPTO_JWK_SECRET'
        }
    },
    database: {
        host: 'DB_HOST',
        port: 'DB_PORT',
        name: 'DB_NAME',
        user: 'DB_USER',
        password: 'DB_PASSWORD'
    },
    // TODO: DELETE IF NOT USED
    queue: {
        protocol: 'QUEUE_PROTOCOL',
        host: 'QUEUE_HOST',
        port: 'QUEUE_PORT',
        vhost: 'QUEUE_VHOST',
        user: 'QUEUE_USER',
        password: 'QUEUE_PASSWORD',
        routing_key: 'QUEUE_ROUTING_KEY',
    },
    server: {
        protocol: 'SERVER_PROTOCOL',
        host: 'SERVER_HOST',
        port: 'SERVER_PORT',
        jwks: 'SERVER_JWKS_ENDPOINT',
        session: 'SERVER_SESSION_EXPIRATION',
        secret: 'SERVER_SESSION_SECRET_KEY',
        cookie: {
            max_age: 'SERVER_COOKIE_MAX_AGE'
        },
        endpoints: {
            web: 'SERVER_WEB_ENDPOINT',
            api: 'SERVER_API_ENDPOINT',
            internal: 'SERVER_INTERNAL_ENDPOINT'
        }
    }
};