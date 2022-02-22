module.exports = {
    env: 'development',
    platform: 'platform',
    module: 'mongodb-storage',
    core: {
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
            folder: 'framework/mongodb-storage-cryptographic-materials'
        },
        signing: {
            keys: {
                http: 'HTTP_SIGNING_KEY'
            }
        },
        scrypt: {
            key_size: 256,
            cost: 65536,
            block_size: 8
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
        port: 3003,
        jwks: '/.well-known/jwks.json',
        authorized_clients: ['http://localhost:3002']
    },
    gateway: {
        identifier: 'data-manager',
        protocol: 'http',
        host: 'localhost',
        port: 3002,
        jwks: '/.well-known/jwks.json'
    }
};