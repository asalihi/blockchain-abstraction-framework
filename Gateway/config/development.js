module.exports = {
    env: 'development',
    platform: 'platform',
    module: 'gateway',
    core: {
        debug: false,
        secure_mode: true,
        operations: {
            retry: 3
        },
        notifications: {
            signature: true
        }
    },
    crypto: {
        materials: {
            folder: 'framework/gateway-cryptographic-materials'
        },
        signing: {
            keys: {
                http: 'HTTP_SIGNING_KEY',
                jwt: 'JWT_SIGNING_KEY'
            }
        },
        jwt: {
            refresh: {
                expiration: '10 days'
            },
            access: {
                expiration: '300 seconds'
            },
            authentication: {
                expiration: '10 seconds'
            },
            genesis: 'GENESIS_TOKEN_ID'
        },
        scrypt: {
            key_size: 256,
            cost: 65536,
            block_size: 8
        },
        salt: {
            size: 256
        },
        identifier: {
            size: 16
        },
        jwk: {
            secret: 'secret'
        }
    },
    database: {
        host: 'localhost',
        port: 27017,
        name: 'framework',
        user: 'user',
        password: 'password'
    },
    // TODO: DELETE IF NOT USED
    queue: {
        protocol: 'amqp',
        host: 'localhost',
        port: 5672,
        exchange: 'framework',
        vhost: 'framework',
        user: 'user',
        password: 'password',
        routing_key: 'notification-manager'
    },
    server: {
        protocol: 'http',
        host: 'localhost',
        port: 3000,
        jwks: '/.well-known/jwks.json',
        secret: 'SESSION_SECRET_KEY',
        session: '10 days',
        cookie: {
            max_age: 86400000
        },
        endpoints: {
            web: 'web',
            api: 'api',
            internal: 'internal'
        }
    }
};