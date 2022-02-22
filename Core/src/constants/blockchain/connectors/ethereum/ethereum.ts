import { HOME_DIRECTORY } from '@core/constants/core';
import { DLTInstanceProfile } from '@core/types/types';

export const ETHEREUM_NETWORK_FOLDER: string = `${HOME_DIRECTORY}/Ethereum Connector`;
export const ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS: string = `${ETHEREUM_NETWORK_FOLDER}/networks`;

export const DEFAULT_ETHEREUM_GENESIS_BLOCK = {
    config: {
		chainId: 121,
		homesteadBlock: 0,
		eip150Block: 0,
		eip155Block: 0,
		eip158Block: 0,
		byzantiumBlock: 0,
		constantinopleBlock: 0
	},
    difficulty: "0x400",
    gasLimit: "0x8000000",
    parentHash : "0x0000000000000000000000000000000000000000000000000000000000000000",
    timestamp : "0x00",
    alloc: {}
};

export const DEFAULT_ETHEREUM_NETWORK_PROFILE: DLTInstanceProfile = {
	"consensus": {
		"type": "public",
		"algorithms": [
			"pow"
		],
		"energy-saving": false
	},
	"contract": {
		"support": true,
		"completeness": true,
		"languages": [
			"Solidity"
		]
	},
	"currency": true,
	"decentralization": 2,
	"fees": 1,
	"finality": 10,
	"governance": {
		"open-source": true,
		"type": "decentralized"
	},
	"immutability": "probabilistic",
	"lightnode": true,
	"maturity": 0,
	"throughput": 10,
	"platform": "public",
	"privacy": {
		"participants": false,
		"transactions": false
	},
	"scalability": "low",
	"security": {
		"quantum-resistant": false,
		"fault-tolerance": 50
	},
	"storage": true,
	"tokenization": true
};