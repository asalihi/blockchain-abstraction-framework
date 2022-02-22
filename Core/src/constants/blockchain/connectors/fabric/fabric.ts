import { HOME_DIRECTORY } from '@core/constants/core';
import { FabricNetworkInstallationConfiguration, DLTInstanceProfile } from '@core/types/types';

export const HYPERLEDGER_FABRIC_VERSION: string = '2.3.3';
export const HYPERLEDGER_FABRIC_CA_VERSION: string = '1.5.2';

export const FABRIC_NETWORK_FOLDER: string = `${HOME_DIRECTORY}/Fabric Connector`;
export const FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS: string = `${FABRIC_NETWORK_FOLDER}/networks`;

export const FABRIC_NETWORK_INSTALLATION_MODE = ['coordinator', 'participant'];
export const FABRIC_NETWORK_TYPE = ['docker']; // TODO: Support distributed configuration (cloud or docker)

export const DEFAULT_FABRIC_NETWORK_PARAMETERS: FabricNetworkInstallationConfiguration = {
	mode: "coordinator",
	type: "docker",
	network: "fabric-network",
	channel: "channel",
	organizations: [
		{
			name: "Organization",
			orderers: {
				servers: {
					tls: {
						name: 'organization-orderers-tls',
						administrator: { username: "administrator", password: "password" },
						port: 7050
					},
					ca: {
						name: 'organization-orderers-ca',
						administrator: { username: "administrator", password: "password" },
						port: 7051
					}
				},
				participants: [
					{
						name: "orderer1",
						password: "password",
						port: 7052
					},
					{
						name: "orderer2",
						password: "password",
						port: 7053
					},
					{
						name: "orderer3",
						password: "password",
						port: 7054
					}
				],
				administrator: { username: "administrator-orderers", password: "password" }
			},
			peers: {
				servers: {
					tls: {
						name: 'organization-peers-tls',
						administrator: { username: "administrator", password: "password" },
						port: 7055
					},
					ca: {
						name: 'organization-peers-ca',
						administrator: { username: "administrator", password: "password" },
						port: 7056
					}
				},
				participants: [
					{
						name: "peer",
						password: "password",
						port: 7057
					}
				],
				administrator: { username: "administrator-peers", password: "password" }
			},
			cli: "peer"
		}
	]
};

export const DEFAULT_FABRIC_NETWORK_PROFILE: DLTInstanceProfile = {
	"consensus": {
		"type": "permissioned",
		"algorithms": [
			"raft"
		],
		"energy-saving": true
	},
	"contract": {
		"support": true,
		"completeness": true,
		"languages": [
			"JavaScript",
			"Java",
			"Go"
		]
	},
	"currency": false,
	"decentralization": 6,
	"fees": 0,
	"finality": 2,
	"governance": {
		"open-source": true,
		"type": "non-profit"
	},
	"immutability": "definitive",
	"lightnode": false,
	"maturity": 0,
	"throughput": 3000,
	"platform": "permissioned",
	"privacy": {
		"participants": true,
		"transactions": true
	},
	"scalability": "high",
	"security": {
		"quantum-resistant": false,
		"fault-tolerance": 33
	},
	"storage": true,
	"tokenization": false
};