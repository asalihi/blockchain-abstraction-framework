const cp = require('child_process');

const HOME_DIRECTORY = cp.execSync(`getent passwd \${SUDO_USER:-$USER} | cut -d: -f6 | tr -d '\n'`, { stdio: 'pipe' }).toString();

module.exports = {
    'env': 'development',
    'ethereum': {
        'provider': 'ws://localhost:8546',
        'account': {
            'address': '0xFd273512b777BF047fe7f94DC11b271F7bc346F3',
            'password': 'password'
        },
        'contract': {
            'address': '0x2E4CD434309abfa9cc7aC2028294B803c26F3987',
            'info': `${ HOME_DIRECTORY }/Ethereum/truffle/build/contracts/KVStore.json`
        }
    },
    'fabric': {
        'profile': `${ HOME_DIRECTORY }/FABRIC_NETWORK_GENERATOR/profiles/fabric-network-connection-profile.json`,
        'wallets': `${ HOME_DIRECTORY }/Wallets`,
        'identity': 'administrator',
        'channel': 'channel',
        'contract': 'store-v1'
    }
};