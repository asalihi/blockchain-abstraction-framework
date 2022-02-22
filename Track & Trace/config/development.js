const cp = require('child_process');

const HOME_DIRECTORY = cp.execSync(`getent passwd \${SUDO_USER:-$USER} | cut -d: -f6 | tr -d '\n'`, { stdio: 'pipe' }).toString();

module.exports = {
    'env': 'development',
    'platform': 'platform',
    'module': 'track-and-trace',
    'core': {
        debug: false,
        secure_mode: true,
        operations: {
            retry: 3
        },
        notifications: {
            signature: true
        }
    },
    'crypto': {
        materials: {
            folder: 'framework/track-and-trace-cryptographic-materials'
        },
        signing: {
            keys: {
                http: 'HTTP_SIGNING_KEY',
                track_and_trace: 'TRACK_AND_TRACE_SIGNING_KEY'
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
        port: 3001,
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
    'track-and-trace': {
        storage: {
            data: 'fabric',
            options: 'fabric',
            verifications: 'fabric',
            traces: 'ethereum'
        }
    },
    'blockchain': {
        'ethereum': {
            provider: 'ws://localhost:8546',
            ipc: `${ HOME_DIRECTORY }/Ethereum/data/geth.ipc`,
            account: {
                address: '0xFd273512b777BF047fe7f94DC11b271F7bc346F3',
                password: 'password'
            },
            contract: {
                address: '0x2E4CD434309abfa9cc7aC2028294B803c26F3987',
                info: `${ HOME_DIRECTORY }/Ethereum/truffle/build/contracts/KVStore.json`
            }
        },
        'fabric': {
            profile: `${ HOME_DIRECTORY }/FABRIC_NETWORK_GENERATOR/profiles/fabric-network-connection-profile.json`,
            wallets: `${ HOME_DIRECTORY }/Wallets`,
            identity: 'administrator',
            channel: 'channel',
            contract: 'store-v1',
            administrator: {
                identity: 'administrator',
                msp: 'OrganizationPeersMSP',
                key: `${ HOME_DIRECTORY }/FABRIC_NETWORK_GENERATOR/networks/fabric-network/network/organization/peers/participants/administrator-peers/msp/keystore/key.pem`,
                certificate: `${ HOME_DIRECTORY }/FABRIC_NETWORK_GENERATOR/networks/fabric-network/network/organization/peers/participants/administrator-peers/msp/signcerts/cert.pem`
            }
        }
    }
};