import { DLT_NETWORKS } from '@core/constants/constants';

export type DLTNetwork = typeof DLT_NETWORKS[number];

export enum DLTInstanceState {
	ACTIVE = 'active',
	INSTALLING = 'installing',
	INSTALLING_MANUALLY = 'installing (manual mode)',
	UNAVAILABLE = 'unavailable',
	PAUSED = 'paused',
	DEACTIVATING = 'deactivating',
	DEACTIVATED = 'deactivated'
};