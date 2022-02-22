import config from 'config';

import { HOME_DIRECTORY } from '@core/constants/constants';
import { Folder } from '@core/types/types';

export const CRYPTO_MATERIALS_FOLDER: Folder = `${HOME_DIRECTORY}/${config.get('crypto.materials.folder') ?? (config.get('platform') + '/' + config.get('module') + '/crypto-materials')}`;