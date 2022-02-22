const cp = require('child_process');

const HOME_DIRECTORY = cp.execSync(`getent passwd \${SUDO_USER:-$USER} | cut -d: -f6 | tr -d '\n'`, { stdio: 'pipe' }).toString();

module.exports = {
    'env': 'development',
    'platform': 'platform',
    'module': 'dlt-managers',
    'core': {
        debug: true,
        secure_mode: false,
        operations: {
            retry: 3
        },
        notifications: {
            signature: true
        }
    },
    'crypto': {
        materials: {
            folder: 'framework/dlt-managers-cryptographic-materials'
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
    'database': {
        host: 'localhost',
        port: 27017,
        name: 'framework',
        user: 'user',
        password: 'password'
    },
    'queue': {
        protocol: 'amqp',
        host: 'localhost',
        port: 5672,
        exchange: 'framework',
        vhost: 'framework',
        user: 'user',
        password: 'password',
        routing_key: 'notification-manager'
    },
    'server': {
        protocol: 'http',
        host: 'localhost',
        port: 3005,
        jwks: '/.well-known/jwks.json',
        authorized_clients: []
    },
    'gateway': {
        identifier: 'gateway',
        protocol: 'http',
        host: 'localhost',
        port: 3000,
        jwks: '/.well-known/jwks.json',
        api: '/internal'
    },
    'blockchain': {
        'ethereum': {
            identifier: 'ethereum-network',
            provider: 'ws://localhost:8546',
            password: 'password',
            contracts: {
                'KVStore': {
                    reference: 'KVStore-v1',
                    template: true
                }
            }
        },
        'fabric': {
            identity: 'administrator',
            network: 'fabric-network',
            channel: 'channel',
            contracts: {
                'store': {
                    reference: 'store-v1',
                    template: true
                }
            }
        }
    }
};