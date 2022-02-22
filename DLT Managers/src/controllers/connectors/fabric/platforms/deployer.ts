import { ExecuteCommand, GenerateYAMLFile, GenerateYAMLFileContent, WriteFile, FABRIC_NETWORK_FOLDER, GenerateDockerComposeFile, BASH_COMMAND_AS_SUDO_USER, FabricOrganization, FabricAdministrator, ReplaceSpacesAndCapitalizeFirstLetterOnly, HYPERLEDGER_FABRIC_VERSION, FabricCAServer, HYPERLEDGER_FABRIC_CA_VERSION, DockerEnvironment, DockerVolumes, DockerServiceDefinition, ReplaceSpacesAndRemoveUppercases, DockerServiceNameWithDefinition, FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS, AllFabricParticipantsOfOrganization, DOCKER_COMPOSE_FILE_VERSION, RecursivePartial, DockerComposeFile, DockerNetworks, ListOfDockerComposeFiles, FabricNetworkInstallationConfiguration, FabricParticipant } from 'core';

export function DeployNetwork(configuration: FabricNetworkInstallationConfiguration): void {
    const ca_compose_files: ListOfDockerComposeFiles = BuildCADockerComposeFiles(configuration);
    const network_compose_files: ListOfDockerComposeFiles = BuildNetworkDockerComposeFiles(configuration);
    const configuration_file = BuildConfigurationFile(configuration);

    const network_location: string = `${FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${configuration['network']}`;
    GenerateNetworkStructure(network_location, configuration);
    GenerateConfigurationFiles(network_location, configuration, ca_compose_files, network_compose_files, configuration_file);

    CreateDockerNetwork(configuration['network']);

    GenerateNetworkProfile(configuration);

    console.log('Network has been created successfully');
}

function GenerateNetworkProfile(configuration: FabricNetworkInstallationConfiguration): void {
    const profile: Object = {
        "name": `${configuration['network']}`,
        "version": "1.0.0",
        "channels": {
            "channel": {
                "peers": configuration['organizations'][0]['peers']['participants'].reduce((o: Object, participant: FabricParticipant) => ({ ...o, [`${ReplaceSpacesAndRemoveUppercases(configuration['organizations'][0]['name'])}-${participant['name']}`]: {}}), {})
            }
        },
        "organizations": {
            [`${configuration['organizations'][0]['name']}`]: {
                "mspid": `${configuration['organizations'][0]['name']}PeersMSP`,
                "adminPrivateKey": {
                    "path": `${FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${configuration['network']}/network/organization/peers/participants/${configuration['organizations'][0]['peers']['administrator']['username']}/msp/keystore/key.pem`
                },
                "peers": configuration['organizations'][0]['peers']['participants'].map((p: FabricParticipant) => `${ReplaceSpacesAndRemoveUppercases(configuration['organizations'][0]['name'])}-${p['name']}`),
                "signedCert": {
                    "path": `${FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${configuration['network']}/network/organization/peers/participants/${configuration['organizations'][0]['peers']['administrator']['username']}/msp/signcerts/cert.pem`
                }
            }
        },
        "peers": configuration['organizations'][0]['peers']['participants'].reduce((o: Object, participant: FabricParticipant) => ({ ...o, [`${ReplaceSpacesAndRemoveUppercases(configuration['organizations'][0]['name'])}-${participant['name']}`]: {
                "grpcOptions": {
                    "ssl-target-name-override": `${ReplaceSpacesAndRemoveUppercases(configuration['organizations'][0]['name'])}-${participant['name']}`,
                    "hostnameOverride": `${ReplaceSpacesAndRemoveUppercases(configuration['organizations'][0]['name'])}-${participant['name']}`
                },
                "tlsCACerts": {
                    "path": `${FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${configuration['network']}/network/${ReplaceSpacesAndRemoveUppercases(configuration['organizations'][0]['name'])}/peers/participants/${participant['name']}/tls-msp/tlscacerts/tls-cert.pem`
                },
                "url": `grpcs://localhost:${participant['port']}`
            }
        }), {})
    };

    WriteFile({ 'location': `${FABRIC_NETWORK_FOLDER}/profiles`, 'name': `${configuration['network']}-connection-profile.json`}, profile);
}

function BuildCADockerComposeFiles(configuration: FabricNetworkInstallationConfiguration): ListOfDockerComposeFiles {
    console.log('Building docker-compose files for CA server...');

    const all_files: ListOfDockerComposeFiles = {};

    for (const organization of configuration['organizations']) {
        const file: RecursivePartial<DockerComposeFile> = {};

        file['version'] = DOCKER_COMPOSE_FILE_VERSION;

        const networks: DockerNetworks = {};
        Object.assign(networks, { 'default': { 'external': { 'name': `${ReplaceSpacesAndRemoveUppercases(configuration['network'])}-network` } } });
        file['networks'] = networks;

        file['services'] = {};
        for(const audience of ['orderers', 'peers'] as (keyof AllFabricParticipantsOfOrganization)[]) {
            for(const server of Object.values(organization[audience]['servers'])) {
                const service = CreateCAServiceDefinition(`${FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${configuration['network']}`, organization['name'], audience, server);
                file['services'][service['name']] = service['definition'];
            }
        }

        all_files[organization['name']] = file as DockerComposeFile;
    }

    console.log('docker-compose files built successfully for CA server');

    return all_files;
}

function BuildNetworkDockerComposeFiles(configuration: FabricNetworkInstallationConfiguration): ListOfDockerComposeFiles {
    console.log('Building docker-compose files for network...');

    const all_files: ListOfDockerComposeFiles = {};

    for (const organization of configuration['organizations']) {
        const file: RecursivePartial<DockerComposeFile> = {};
        file['version'] = DOCKER_COMPOSE_FILE_VERSION;

        const networks: DockerNetworks = {};
        Object.assign(networks, { 'default': { 'external': { 'name': `${configuration['network']}-network` } } });
        file['networks'] = networks;

        file['services'] = {};

        organization['orderers']['participants'].forEach((orderer: FabricParticipant) => {
            const service = CreateOrdererServiceDefinition(`${FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${configuration['network']}`, organization['name'], orderer);
            file['services']![service['name']] = service['definition'];
        });

        const first_peer: FabricParticipant = organization['peers']['participants'][0];
        organization['peers']['participants'].forEach((peer: FabricParticipant) => {
            const service = CreatePeerServiceDefinition(configuration['network'], `${FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${configuration['network']}`, organization['name'], peer, first_peer);
            file['services']![service['name']] = service['definition'];
        });

        file['services'][`${ReplaceSpacesAndRemoveUppercases(organization['name'])}-cli`] = CreateCLIServiceDefinition(`${FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${configuration['network']}`, organization['name'], organization['peers']['participants'].find((p: FabricParticipant) => p['name'] === organization['cli']) as FabricParticipant, organization['peers']['administrator']);

        all_files[organization['name']] = file as DockerComposeFile;
    }

    console.log('docker-compose files built successfully for network');

    return all_files;
}

function CreateCAServiceDefinition(location: string, organization: string, audience: 'orderers' | 'peers', server: FabricCAServer): DockerServiceNameWithDefinition {
    const service: string = server['name'];

    const definition: Partial<DockerServiceDefinition> = {};
    Object.assign(definition, { 'container_name': service });
    Object.assign(definition, { 'image': `hyperledger/fabric-ca:${HYPERLEDGER_FABRIC_CA_VERSION}` });
    Object.assign(definition, { 'command': `sh -c "fabric-ca-server start -b ${server['administrator']['username']}:${server['administrator']['password']}"` });

    const environment: DockerEnvironment = [];
    environment.push('FABRIC_CA_SERVER_HOME=/etc/hyperledger/fabric-ca/server');
    environment.push('FABRIC_CA_SERVER_CSR_HOSTS=0.0.0.0');
    environment.push('FABRIC_CA_SERVER_TLS_ENABLED=true');
    environment.push(`FABRIC_CA_SERVER_CA_NAME=${service}`);
    environment.push(`FABRIC_CA_SERVER_CSR_CN=${service}`);
    environment.push(`FABRIC_CA_SERVER_PORT=${server['port']}`);
    environment.push('FABRIC_CA_DEBUG=false');
    definition['environment'] = environment;

    const volumes: DockerVolumes = [];
    volumes.push(`${location}/network/${ReplaceSpacesAndRemoveUppercases(organization)}/${audience}/servers/${server['name']}:/etc/hyperledger/fabric-ca`);
    definition['volumes'] = volumes;

    definition['ports'] = [`${server['port']}:${server['port']}`];

    return { name: service, definition: definition as DockerServiceDefinition };
}

function CreateOrdererServiceDefinition(location: string, organization: string, orderer: FabricParticipant): DockerServiceNameWithDefinition {
    const service: string = `${ReplaceSpacesAndRemoveUppercases(organization)}-${orderer['name']}`;

    const definition: RecursivePartial<DockerServiceDefinition> = {};
    Object.assign(definition, { 'container_name': service });
    Object.assign(definition, { 'image': `hyperledger/fabric-orderer:${HYPERLEDGER_FABRIC_VERSION}` });

    const environment: DockerEnvironment = [];
    environment.push('ORDERER_HOME=/etc/hyperledger/orderer');
    environment.push(`ORDERER_HOST=${service}`);
    environment.push('ORDERER_GENERAL_LISTENADDRESS=0.0.0.0');
    environment.push(`ORDERER_GENERAL_LISTENPORT=${orderer['port']}`);
    environment.push('ORDERER_GENERAL_GENESISMETHOD=file');
    environment.push('ORDERER_GENERAL_GENESISFILE=/etc/hyperledger/orderer/genesis.block');
    environment.push(`ORDERER_GENERAL_LOCALMSPID=${ReplaceSpacesAndCapitalizeFirstLetterOnly(organization)}OrderersMSP`);
    environment.push('ORDERER_GENERAL_LOCALMSPDIR=/etc/hyperledger/orderer/msp');
    environment.push('ORDERER_GENERAL_TLS_ENABLED=true');
    environment.push('ORDERER_GENERAL_TLS_CERTIFICATE=/etc/hyperledger/orderer/tls-msp/signcerts/cert.pem');
    environment.push('ORDERER_GENERAL_TLS_PRIVATEKEY=/etc/hyperledger/orderer/tls-msp/keystore/key.pem');
    environment.push(`ORDERER_GENERAL_TLS_ROOTCAS=\[/etc/hyperledger/orderer/tls-msp/tlscacerts/tls-cert.pem\]`);
    environment.push('ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/etc/hyperledger/orderer/tls-msp/signcerts/cert.pem');
    environment.push('ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/etc/hyperledger/orderer/tls-msp/keystore/key.pem');
    environment.push('ORDERER_GENERAL_CLUSTER_ROOTCAS=\[/etc/hyperledger/orderer/tls-msp/tlscacerts/tls-cert.pem\]');
    environment.push('ORDERER_GENERAL_LOGLEVEL=true');
    environment.push('ORDERER_DEBUG_BROADCASTTRACEDIR=data/logs');
    environment.push('FABRIC_LOGGING_SPEC=info');
    definition['environment'] = environment;

    const volumes: DockerVolumes = [];
    volumes.push(`${location}/network/${ReplaceSpacesAndRemoveUppercases(organization)}/orderers/participants/${orderer['name']}:/etc/hyperledger/orderer`);
    volumes.push(`${location}/configuration/channel-artifacts/genesis.block:/etc/hyperledger/orderer/genesis.block`);
    definition['volumes'] = volumes;

    definition['ports'] = [`${orderer['port']}:${orderer['port']}`];

    return { name: service, definition: definition as DockerServiceDefinition };
}

function CreatePeerServiceDefinition(network: string, location: string, organization: string, peer: FabricParticipant, bootstrap_peer: FabricParticipant): DockerServiceNameWithDefinition {
    const service: string = `${ReplaceSpacesAndRemoveUppercases(organization)}-${peer['name']}`;

    const definition: RecursivePartial<DockerServiceDefinition> = {};
    Object.assign(definition, { 'container_name': service });
    Object.assign(definition, { 'image': `hyperledger/fabric-peer:${HYPERLEDGER_FABRIC_VERSION}` });
    Object.assign(definition, { 'working_dir': '/opt/gopath/src/github.com/hyperledger/fabric/peer' });

    const environment: DockerEnvironment = [];
    environment.push(`CORE_PEER_ID=${service}`);
    environment.push(`CORE_PEER_ADDRESS=${service}:${peer['port']}`);
    environment.push(`CORE_PEER_LISTENADDRESS=0.0.0.0:${peer['port']}`);
    environment.push(`CORE_PEER_LOCALMSPID=${ReplaceSpacesAndCapitalizeFirstLetterOnly(organization)}PeersMSP`);
    environment.push('CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peer/msp');
    environment.push('CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock');
    environment.push(`CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=${network}-network`);
    environment.push('FABRIC_LOGGING_SPEC=info');
    environment.push('CORE_PEER_TLS_ENABLED=true');
    environment.push('CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/peer/tls-msp/signcerts/cert.pem');
    environment.push('CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/peer/tls-msp/keystore/key.pem');
    environment.push('CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/peer/tls-msp/tlscacerts/tls-cert.pem');
    environment.push('CORE_PEER_GOSSIP_USELEADERELECTION=true');
    environment.push('CORE_PEER_GOSSIP_ORGLEADER=false');
    environment.push(`CORE_PEER_GOSSIP_EXTERNALENDPOINT=${service}:${peer['port']}`);
    if (peer['name'] !== bootstrap_peer['name']) environment.push(`CORE_PEER_GOSSIP_BOOTSTRAP=${ReplaceSpacesAndRemoveUppercases(organization)}-${bootstrap_peer['name']}:${bootstrap_peer['port']}`);
    definition['environment'] = environment;

    const volumes: DockerVolumes = [];
    volumes.push('/var/run:/host/var/run');
    volumes.push(`${location}/network/${ReplaceSpacesAndRemoveUppercases(organization)}/peers/participants/${peer['name']}:/etc/hyperledger/peer`);
    definition['volumes'] = volumes;

    definition['ports'] = [`${peer['port']}:${peer['port']}`];

    return { name: service, definition: definition as DockerServiceDefinition };
}

function CreateCLIServiceDefinition(location: string, organization: string, peer: FabricParticipant, administrator: FabricAdministrator): DockerServiceDefinition {
    const service: string = `${ReplaceSpacesAndRemoveUppercases(organization)}-cli`;

    const definition: RecursivePartial<DockerServiceDefinition> = {};
    Object.assign(definition, { 'container_name': service });
    Object.assign(definition, { 'image': `hyperledger/fabric-tools:${HYPERLEDGER_FABRIC_VERSION}` });
    Object.assign(definition, { 'tty': true });
    Object.assign(definition, { 'stdin_open': true });

    const environment: DockerEnvironment = [];
    environment.push('GOPATH=/opt/gopath');
    environment.push('CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock');
    environment.push('FABRIC_LOGGING_SPEC=info');
    environment.push('CORE_PEER_ID=cli');
    environment.push(`CORE_PEER_ADDRESS=${ReplaceSpacesAndRemoveUppercases(organization)}-${peer['name']}:${peer['port']}`);
    environment.push(`CORE_PEER_LOCALMSPID=${ReplaceSpacesAndCapitalizeFirstLetterOnly(organization)}PeersMSP`);
    environment.push(`CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peers/${administrator['username']}/msp`);
    environment.push('CORE_PEER_TLS_ENABLED=true');
    environment.push(`CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peers/${peer['name']}/tls-msp/signcerts/cert.pem`);
    environment.push(`CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peers/${peer['name']}/tls-msp/keystore/key.pem`);
    environment.push(`CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peers/${peer['name']}/tls-msp/tlscacerts/tls-cert.pem`);
    definition['environment'] = environment;

    definition['working_dir'] = '/opt/gopath/src/github.com/hyperledger/fabric';

    definition['command'] = '/bin/bash';

    const volumes: DockerVolumes = [];
    volumes.push(`${location}/network/${ReplaceSpacesAndRemoveUppercases(organization)}/orderers/msp:/opt/gopath/src/github.com/hyperledger/fabric/orderers/msp`);
    volumes.push(`${location}/network/${ReplaceSpacesAndRemoveUppercases(organization)}/peers/participants:/opt/gopath/src/github.com/hyperledger/fabric/peers`);
    volumes.push(`${location}/network:/opt/gopath/src/github.com/hyperledger/fabric/network`);
    volumes.push(`${location}/configuration/channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/channel-artifacts`);
    volumes.push(`${location}/configuration/chaincodes:/opt/gopath/src/github.com/hyperledger/fabric/chaincodes`);
    definition['volumes'] = volumes;

    return definition as DockerServiceDefinition;
}

function BuildConfigurationFile(configuration: FabricNetworkInstallationConfiguration): any {
    console.log('Building configuration file of network...');

    const configuration_of_all_organizations = configuration['organizations'].map((organization: FabricOrganization) => {
        const CapitalizedNameOfOrganization: string = ReplaceSpacesAndCapitalizeFirstLetterOnly(organization['name']);
        const OrganizationFolder: string = `${FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${configuration['network']}/network/${ReplaceSpacesAndRemoveUppercases(organization['name'])}`;
        const OrderersMSP: string = `${CapitalizedNameOfOrganization}OrderersMSP`;
        const PeersMSP: string = `${CapitalizedNameOfOrganization}PeersMSP`;
        return {
            'orderers': {
                Name: `${CapitalizedNameOfOrganization}Orderers`,
                ID: OrderersMSP,
                MSPDir: `${OrganizationFolder}/orderers/msp`,
                Policies: {
                    Readers: {
                        Type: 'Signature',
                        Rule: `OR('${OrderersMSP}.member')`
                    },
                    Writers: {
                        Type: 'Signature',
                        Rule: `OR('${OrderersMSP}.member')`
                    },
                    Admins: {
                        Type: 'Signature',
                        Rule: `OR('${OrderersMSP}.admin')`
                    }
                },
                OrdererEndpoints: organization['orderers']['participants'].map((orderer: FabricParticipant) => `${ReplaceSpacesAndRemoveUppercases(organization['name'])}-${orderer['name']}:${orderer['port']}`)
            },
            'peers': {
                Name: `${CapitalizedNameOfOrganization}Peers`,
                ID: PeersMSP,
                MSPDir: `${OrganizationFolder}/peers/msp`,
                Policies: {
                    Readers: {
                        Type: 'Signature',
                        Rule: `'OR('${PeersMSP}.admin', '${PeersMSP}.peer', '${PeersMSP}.client')'`
                    },
                    Writers: {
                        Type: 'Signature',
                        Rule: `'OR('${PeersMSP}.admin', '${PeersMSP}.client')'`
                    },
                    Admins: {
                        Type: 'Signature',
                        Rule: `OR('${PeersMSP}.admin')`
                    },
                    Endorsement: {
                        Type: 'Signature',
                        Rule: `OR('${PeersMSP}.peer')`
                    }
                },
                AnchorPeers: [
                    {
                        Host: `${ReplaceSpacesAndRemoveUppercases(organization['name'])}-${organization['cli'] ?? organization['peers']['participants'][0]['name']}`,
                        Port: (organization['cli'] ? organization['peers']['participants'].find((p: FabricParticipant) => p['name'] === organization['cli'])! : organization['peers']['participants'][0])['port']
                    }
                ]
            },
            'consenters': organization['orderers']['participants'].map((orderer: FabricParticipant) => {
                const certificate: string = `${OrganizationFolder}/orderers/participants/${orderer['name']}/tls-msp/signcerts/cert.pem`;
                return { Host: `${ReplaceSpacesAndRemoveUppercases(organization['name'])}-${orderer['name']}`, Port: orderer['port'], ClientTLSCert: certificate, ServerTLSCert: certificate };
            })
        };
    });

    const ChannelCapabilities: any = { V2_0: true };
    const OrdererCapabilities: any = { V2_0: true };
    const ApplicationCapabilities: any = { V2_0: true };
    const Capabilities: any = { Channel: ChannelCapabilities, Orderer: OrdererCapabilities, Application: ApplicationCapabilities };

    const ApplicationDefaultparameters: any = {
        Organizations: null,
        Policies: {
            LifecycleEndorsement: {
                Type: 'ImplicitMeta',
                Rule: 'MAJORITY Endorsement'
            },
            Endorsement: {
                Type: 'ImplicitMeta',
                Rule: 'MAJORITY Endorsement'
            },
            Readers: {
                Type: 'ImplicitMeta',
                Rule: 'ANY Readers'
            },
            Writers: {
                Type: 'ImplicitMeta',
                Rule: 'ANY Writers'
            },
            Admins: {
                Type: 'ImplicitMeta',
                Rule: 'MAJORITY Admins'
            }
        },
        Capabilities: ApplicationCapabilities
    };

    const OrdererDefaultParameters: any = {
        OrdererType: 'etcdraft',
        Addresses: configuration_of_all_organizations.map((configuration) => configuration['orderers']['OrdererEndpoints']).flat(),
        BatchTimeout: '2s',
        BatchSize: {
            MaxMessageCount: 500,
            AbsoluteMaxBytes: '10 MB',
            PreferredMaxBytes: '2 MB'
        },
        MaxChannels: 0,
        EtcdRaft: {
            Consenters: configuration_of_all_organizations.map((configuration) => configuration['consenters']).flat(),
            Options: {
                TickInterval: '500ms',
                ElectionTick: 10,
                HeartbeatTick: 1,
                MaxInflightBlocks: 5,
                SnapshotIntervalSize: '16 MB'
            }
        },
        Organizations: null,
        Policies: {
            Readers: {
                Type: 'ImplicitMeta',
                Rule: 'ANY Readers'
            },
            Writers: {
                Type: 'ImplicitMeta',
                Rule: 'ANY Writers'
            },
            Admins: {
                Type: 'ImplicitMeta',
                Rule: 'MAJORITY Admins'
            },
            BlockValidation: {
                Type: 'ImplicitMeta',
                Rule: 'ANY Writers'
            }
        },
        Capabilities: OrdererCapabilities
    };

    const ChannelDefaultParameters: any = {
        Policies: {
            Readers: {
                Type: 'ImplicitMeta',
                Rule: 'ANY Readers'
            },
            Writers: {
                Type: 'ImplicitMeta',
                Rule: 'ANY Writers'
            },
            Admins: {
                Type: 'ImplicitMeta',
                Rule: 'MAJORITY Admins'
            }
        },
        Capabilities: ChannelCapabilities
    };

    const AllOrderersOrganizations = configuration_of_all_organizations.map((configuration) => configuration['orderers']);
    const AllPeersOrganizations = configuration_of_all_organizations.map((configuration) => configuration['peers']);

    const AllOrderersAndPeersOrganizations = [...AllOrderersOrganizations, ...AllPeersOrganizations];

    const OrderersProfile = Object.assign({}, ChannelDefaultParameters, { Orderer: Object.assign({}, OrdererDefaultParameters, { Organizations: AllOrderersOrganizations }), Application: Object.assign({}, ApplicationDefaultparameters, { Organizations: AllOrderersOrganizations }), Consortiums: { Consortium: { Organizations: AllPeersOrganizations } } });
    const PeersProfile = Object.assign({}, ChannelDefaultParameters, { Consortium: 'Consortium' }, { Application: Object.assign({}, ApplicationDefaultparameters, { Organizations: AllPeersOrganizations, Capabilities: ApplicationCapabilities }) });

    const ConfigurationFile = {
        Organizations: AllOrderersAndPeersOrganizations,
        Capabilities: Capabilities,
        Application: ApplicationDefaultparameters,
        Orderer: OrdererDefaultParameters,
        Channel: ChannelDefaultParameters,
        Profiles: { OrderersGenesis: OrderersProfile, OrgsChannel: PeersProfile }
    };

    console.log('Configuration file built successfully');

    return ConfigurationFile;
}

function GenerateNetworkStructure(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('Generating network structure...');
    
    ExecuteCommand(`bash -c 'rm -rf ${network_location}'`);
    ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'mkdir -p ${network_location}/configuration/{ca,network,channel-artifacts,chaincodes}'`);

    for (const organization of configuration['organizations']) {
        ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'mkdir -p ${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization['name'])}/{orderers/{servers/{${Object.values(organization['orderers']['servers']).map((server: FabricCAServer) => `${server['name']}/{${server['administrator']['username']},server}`).join(',')}},msp/{cacerts,tlscacerts},tls-msp/{cacerts/tlscacerts},participants},peers/{servers/{${Object.values(organization['peers']['servers']).map((server: FabricCAServer) => `${server['name']}/{${server['administrator']['username']},server}`).join(',')}},msp/{cacerts,tlscacerts},tls-msp/{cacerts,tlscacerts},participants}}'`);

        [...organization['orderers']['participants'].map((p: FabricParticipant) => p['name']), organization['orderers']['administrator']['username']].map((orderer: string) => `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization['name'])}/orderers/participants/${orderer}`).forEach((path: string) => {
            ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'mkdir -p ${path}/{msp,tls-msp}'`);
        });

        [...organization['peers']['participants'].map((p: FabricParticipant) => p['name']), organization['peers']['administrator']['username']].map((peer: string) => `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization['name'])}/peers/participants/${peer}`).forEach((path: string) => {
            ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'mkdir -p ${path}/{msp,tls-msp}'`);
        });
    }

    console.log('Network structure generated successfully');
}

function GenerateConfigurationFiles(network_location: string, configuration: FabricNetworkInstallationConfiguration, ca_compose_files: ListOfDockerComposeFiles, network_compose_files: ListOfDockerComposeFiles, configuration_file: any): void {
    console.log('Generating configuration files...');
    
    for (const [organization, file] of Object.entries(ca_compose_files)) {
        GenerateDockerComposeFile({ location: `${network_location}/configuration/ca`, name: `${organization}.yaml` }, file);
    }

    for (const [organization, file] of Object.entries(network_compose_files)) {
        GenerateDockerComposeFile({ location: `${network_location}/configuration/network`, name: `${organization}.yaml` }, file);
    }

    WriteFile({ 'location': `${network_location}/configuration`, 'name': 'configtx.yaml'}, GenerateYAMLFileContent(configuration_file));

    GenerateConfigurationFilesForAllCAServers(network_location, configuration);

    GenerateConfigurationFilesForParticipantsOfAllOrganizations(network_location, configuration);

    console.log('Configuration files generated successfully');
}

function GenerateConfigurationFilesForAllCAServers(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    for (const organization of configuration['organizations']) {
        GenerateCAConfigurationFilesForOrganization(network_location, organization);
    }
}

function GenerateCAConfigurationFilesForOrganization(network_location: string, organization: FabricOrganization): void {
    (['orderers', 'peers'] as (keyof AllFabricParticipantsOfOrganization)[]).forEach((audience: keyof AllFabricParticipantsOfOrganization) => {
        GenerateCAConfigurationFilesForAudienceOfOrganization(network_location, organization['name'], audience, Object.values(organization[audience]['servers']));
    });
}

function GenerateCAConfigurationFilesForAudienceOfOrganization(network_location: string, organization: string, audience: string, servers: FabricCAServer[]): void {
    for (const server of servers) {
        const NameOfCAServer: string = server['name'];

        const Version: string = HYPERLEDGER_FABRIC_CA_VERSION;
        const Port: number = server['port'];
        const Cors: any = {
            enabled: false,
            origins: ['*']
        };
        const Debug: boolean = false;
        const CRLSizeLimit: number = 512000;
        const CA: any = {
            name: NameOfCAServer
        };
        const CRL: any = {
            expiry: '24h'
        };
        const Registry: any = {
            maxenrollments: -1,
            identities: [
                {
                    name: server['administrator']['username'],
                    pass: server['administrator']['password'],
                    type: 'client',
                    affiliation: null,
                    attrs: {
                        'hf.Registrar.Roles': '*',
                        'hf.Registrar.DelegateRoles': '*',
                        'hf.Revoker': true,
                        'hf.IntermediateCA': true,
                        'hf.GenCRL': true,
                        'hf.Registrar.Attributes': '*',
                        'hf.AffiliationMgr': true
                    }
                }
            ]
        };
        const DB: any = {
            type: 'sqLite3',
            datasource: 'fabric-ca-server.db',
            tls: { enabled: false }
        };
        const LDAP: any = {
            enabled: false
        };
        const Affiliations: any = null;
        const Signing: any = {
            default: {
                usage: ['digital signature'],
                expiry: '8760h'
            },
            profiles: {
                ca: {
                    usage: ['cert sign', 'crl sign'],
                    expiry: '43000h',
                    caconstraint: {
                        isca: true,
                        maxpathlen: 0
                    }
                },
                tls: {
                    usage: ['signing', 'key encipherment', 'server auth', 'client auth', 'key agreement'],
                    expiry: '8760h'
                }
            }
        };
        const CSR: any = {
            cn: NameOfCAServer,
            keyrequest: {
                algo: 'ecdsa',
                size: 256
            },
            names: [{ C: 'CH', ST: 'Geneva', L: null, O: organization, OU: null }],
            hosts: ['localhost'],
            ca: {
                expiry: '131400h',
                pathlength: 1
            }
        };
        const Idemix: any = {
            rhpoolsize: 1000,
            nonceexpiration: '15s',
            noncesweepinterval: '15m'
        };
        const BCCSP: any = {
            default: 'SW',
            sw: {
                hash: 'SHA2',
                security: 256,
                filekeystore: {
                    keystore: 'msp/keystore'
                }
            }
        };
        const CFG: any = {
            identities: {
                passwordattempts: 10
            }
        };
        const Operations: any = {
            listenAddress: '127.0.0.1:9443'
        };
        const Metrics: any = {
            provider: 'disabled',
            statsd: {
                network: 'udp',
                address: '127.0.0.1:8125',
                writeInterval: '10s',
                prefix: 'server'
            }
        };

        const Configuration: any = {
            version: Version,
            port: Port,
            cors: Cors,
            debug: Debug,
            crlsizelimit: CRLSizeLimit,
            ca: CA,
            crl: CRL,
            registry: Registry,
            db: DB,
            ldap: LDAP,
            affiliations: Affiliations,
            signing: Signing,
            csr: CSR,
            idemix: Idemix,
            bccsp: BCCSP,
            cfg: CFG,
            operations: Operations,
            metrics: Metrics
        };

        GenerateYAMLFile({ 'location': `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization)}/${audience}/servers/${NameOfCAServer}/server`, 'name': 'fabric-ca-config-server.yaml'}, Configuration);
    }
}

function GenerateConfigurationFilesForParticipantsOfAllOrganizations(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    for (const organization of configuration['organizations']) {
        (['orderers', 'peers'] as (keyof AllFabricParticipantsOfOrganization)[]).forEach((audience: keyof AllFabricParticipantsOfOrganization) => {
            GenerateConfigurationFilesForAllParticipantsOfAudience(network_location, organization['name'], audience, [...organization[audience]['participants'].map((p: FabricParticipant) => p['name']), organization[audience]['administrator']['username']]);
        });
    }
}

function GenerateConfigurationFilesForAllParticipantsOfAudience(network_location: string, organization: string, audience: 'orderers' | 'peers', participants: string[]): void {
    const Configuration: any = {
        NodeOUs: {
            Enable: true,
            ClientOUIdentifier: {
                Certificate: 'cacerts/ca-cert.pem',
                OrganizationalUnitIdentifier: 'client'
            },
            PeerOUIdentifier: {
                Certificate: 'cacerts/ca-cert.pem',
                OrganizationalUnitIdentifier: 'peer'
            },
            AdminOUIdentifier: {
                Certificate: 'cacerts/ca-cert.pem',
                OrganizationalUnitIdentifier: 'admin'
            },
            OrdererOUIdentifier: {
                Certificate: 'cacerts/ca-cert.pem',
                OrganizationalUnitIdentifier: 'orderer'
            }
        }
    }

    GenerateYAMLFile({ location: `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization)}/${audience}/msp`, name: 'config.yaml' }, Configuration);
    for (const participant of participants) {
        GenerateYAMLFile({ location: `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization)}/${audience}/participants/${participant}/msp/`, name: 'config.yaml' }, Configuration);
    }
}

function CreateDockerNetwork(network: string): void {
    console.log(`Creating docker network: ${network}-network`);
    ExecuteCommand(`docker network create ${network}-network || true`);
    console.log('docker network created successfully');
}