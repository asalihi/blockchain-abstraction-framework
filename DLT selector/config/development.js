const cp = require('child_process');

const HOME_DIRECTORY = cp.execSync(`getent passwd \${SUDO_USER:-$USER} | cut -d: -f6 | tr -d '\n'`, { stdio: 'pipe' }).toString();

module.exports = {
    'instances': `${ HOME_DIRECTORY }/DLT selector/config/instances.json`,
    'criteria': `${ HOME_DIRECTORY }/DLT selector/config/criteria.json`
};