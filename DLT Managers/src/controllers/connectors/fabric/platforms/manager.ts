import { env, ShellString } from 'shelljs';

import { ExecuteCommand, ReplaceSpacesAndRemoveUppercases, ReplaceSpacesAndCapitalizeFirstLetterOnly, FabricOrganization, FabricParticipant, FabricAdministrator, HYPERLEDGER_FABRIC_VERSION, FabricNetworkInstallationConfiguration, HYPERLEDGER_FABRIC_CA_VERSION, FABRIC_NETWORK_FOLDER, FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS, AllFabricParticipantsOfOrganization } from 'core';

export async function StartNetwork(configuration: FabricNetworkInstallationConfiguration): Promise<void> {
    const network_location: string = `${FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${configuration['network']}`;
    
    SetupCAServers(network_location, configuration);
    EnrollAdministratorOfCAServers(network_location, configuration);
    RegisterUsersWithCAServers(network_location, configuration);
    EnrollUsersWithCAServers(network_location, configuration);
    ManageAllCredentials(network_location, configuration);
    GenerateGenesisBlock(network_location, configuration);
    GenerateChannelConfigurationFile(network_location, configuration);
    GenerateAnchorPeersUpdateFiles(network_location, configuration);
    StartOrderersAndPeersOfAllOrganizations(network_location, configuration);
    CreateChannel(network_location, configuration);
    ConnectOrganizationsToChannel(network_location, configuration);
    UpdateAnchorPeers(network_location, configuration);
    ManageNetworkStructure(network_location);
}

function SetupCAServers(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Starting CA servers...');

    // TODO: Start containers in parallel tasks
    for (const organization of configuration['organizations']) {
        console.log(`+ Starting servers for organization: ${organization['name']}`);
        ExecuteCommand(`docker-compose -f ${network_location}/configuration/ca/${organization['name']}.yaml up -d`);
    }

    console.log('CA servers started successfully');

    console.log('Sleeping 5 seconds...');
    ExecuteCommand('sleep 5');
}

function EnrollAdministratorOfCAServers(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Enrolling administrator of all CA servers...');

    for (const organization of configuration['organizations']) {
        console.log(`+ Enrolling administrator of servers of ${organization['name']}`);
        (['orderers', 'peers'] as (keyof AllFabricParticipantsOfOrganization)[]).forEach((audience: keyof AllFabricParticipantsOfOrganization) => {
            for (const [type, server] of Object.entries(organization[audience]['servers'])) {
                env['FABRIC_CA_CLIENT_TLS_CERTFILES'] = `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization['name'])}/${audience}/servers/${server['name']}/server/${type}-cert.pem`;
                env['FABRIC_CA_CLIENT_HOME'] = `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization['name'])}/${audience}/servers/${server['name']}/${server['administrator']['username']}`;
                ExecuteCommand(`${FABRIC_NETWORK_FOLDER}/tools/fabric-ca-${HYPERLEDGER_FABRIC_CA_VERSION}/fabric-ca-client enroll -u https://${server['administrator']['username']}:${server['administrator']['password']}@0.0.0.0:${server['port']}`);
            }
        });
    }

    console.log('All administrators have been enrolled');
    console.log('Sleeping 5 seconds...');
    ExecuteCommand('sleep 5');
}

function RegisterUsersWithCAServers(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Registration of all users with CA servers...');

    for (const organization of configuration['organizations']) {
        console.log(`+ Registration of users of ${organization['name']}`);
        (['orderers', 'peers'] as (keyof AllFabricParticipantsOfOrganization)[]).forEach((audience: keyof AllFabricParticipantsOfOrganization) => {
            for (const [type, server] of Object.entries(organization[audience]['servers'])) {
                env['FABRIC_CA_CLIENT_TLS_CERTFILES'] = `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization['name'])}/${audience}/servers/${server['name']}/server/${type}-cert.pem`;
                env['FABRIC_CA_CLIENT_HOME'] = `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization['name'])}/${audience}/servers/${server['name']}/${server['administrator']['username']}`;

                const administrator: FabricAdministrator = organization[audience]['administrator'];
                ExecuteCommand(`${FABRIC_NETWORK_FOLDER}/tools/fabric-ca-${HYPERLEDGER_FABRIC_CA_VERSION}/fabric-ca-client register --id.name ${administrator['username']} --id.secret ${administrator['password']} ${(type === 'ca') ? '--id.type admin --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert"' : ''} -u https://0.0.0.0:${server['port']}`);

                for (const participant of organization[audience]['participants']) {
                    ExecuteCommand(`${FABRIC_NETWORK_FOLDER}/tools/fabric-ca-${HYPERLEDGER_FABRIC_CA_VERSION}/fabric-ca-client register --id.name ${participant['name']} --id.secret ${participant['password']} --id.type ${audience.substring(0, audience.length - 1)} -u https://0.0.0.0:${server['port']}`);
                }
            }
        });
    }

    console.log('All users registered with CA servers');
}

function EnrollUsersWithCAServers(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Enrolling all users with CA servers...');

    for (const organization of configuration['organizations']) {
        console.log(`+ Enrollment of users of ${organization['name']}`);
        (['orderers', 'peers'] as (keyof AllFabricParticipantsOfOrganization)[]).forEach((audience: keyof AllFabricParticipantsOfOrganization) => {
            for (const [type, server] of Object.entries(organization[audience]['servers'])) {
                env['FABRIC_CA_CLIENT_MSPDIR'] = (type === 'ca') ? 'msp' : 'tls-msp';
                env['FABRIC_CA_CLIENT_TLS_CERTFILES'] = `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization['name'])}/${audience}/servers/${server['name']}/${server['administrator']['username']}/msp/cacerts/0-0-0-0-${server['port']}.pem`;

                const administrator: FabricAdministrator = organization[audience]['administrator'];
                for (const participant of [...organization[audience]['participants'], { 'name': administrator['username'], 'password': administrator['password'] }]) {
                    env['FABRIC_CA_CLIENT_HOME'] = `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization['name'])}/${audience}/participants/${participant['name']}`;
                    ExecuteCommand(`${FABRIC_NETWORK_FOLDER}/tools/fabric-ca-${HYPERLEDGER_FABRIC_CA_VERSION}/fabric-ca-client enroll -u https://${participant['name']}:${participant['password']}@0.0.0.0:${server['port']} ${(type === 'tls') ? '--enrollment.profile tls' : ''} --csr.hosts "${ReplaceSpacesAndRemoveUppercases(organization['name'])}-${participant['name']}"`);
                }
            }
        });
    }

    console.log('All users were enrolled successfully');
}

function ManageAllCredentials(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Managing all generated credentials...');

    for (const organization of configuration['organizations']) {
        console.log(`+ Managing generated credentials of ${organization['name']}`);
        (['orderers', 'peers'] as (keyof AllFabricParticipantsOfOrganization)[]).forEach((audience: keyof AllFabricParticipantsOfOrganization) => {
            const audience_path: string = `${network_location}/network/${ReplaceSpacesAndRemoveUppercases(organization['name'])}/${audience}`;

            console.log(`Managing credentials of CA servers for ${audience}...`);
            for (const [type, server] of Object.entries(organization[audience]['servers'])) {
                const cacerts: string = `${audience_path}/msp/${(type === 'tls') ? 'tlsca' : 'ca'}certs`;
                ExecuteCommand(`bash -c 'cp ${audience_path}/servers/${server['name']}/${server['administrator']['username']}/msp/cacerts/0-0-0-0-${server['port']}.pem ${cacerts}'`);
                ExecuteCommand(`bash -c 'mv ${cacerts}/* ${cacerts}/${(type === 'tls') ? 'tls-cert' : 'ca-cert'}.pem'`);
            }

            console.log(`Managing credentials of participants for ${audience}...`);
            const administrator: FabricAdministrator = organization[audience]['administrator'];
            for (const participant of [...organization[audience]['participants'].map((p: FabricParticipant) => p['name']), administrator['username']]) {
                const tls_keystore: string = `${audience_path}/participants/${participant}/tls-msp/keystore`;
                ExecuteCommand(`bash -c 'mv ${tls_keystore}/* ${tls_keystore}/key.pem'`);

                const keystore: string = `${audience_path}/participants/${participant}/msp/keystore`;
                ExecuteCommand(`bash -c 'mv ${keystore}/* ${keystore}/key.pem'`);

                const tls_cacerts: string = `${audience_path}/participants/${participant}/tls-msp/tlscacerts`;
                ExecuteCommand(`bash -c 'mv ${tls_cacerts}/* ${tls_cacerts}/tls-cert.pem'`);

                const cacerts: string = `${audience_path}/participants/${participant}/msp/cacerts`;
                ExecuteCommand(`bash -c 'mv ${cacerts}/* ${cacerts}/ca-cert.pem'`);
            }
        });
    }

    console.log('All generated credentials managed successfully');
}

function GenerateGenesisBlock(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Generating genesis block...');

    env['FABRIC_CFG_PATH'] = `${network_location}/configuration`;
    ExecuteCommand(`${FABRIC_NETWORK_FOLDER}/tools/fabric-${HYPERLEDGER_FABRIC_VERSION}/configtxgen -profile OrderersGenesis -outputBlock ${network_location}/configuration/channel-artifacts/genesis.block -channelID orderers`);

    console.log('Genesis block generated successfully');
}

function GenerateChannelConfigurationFile(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Generating channel configuration file...');

    env['FABRIC_CFG_PATH'] = `${network_location}/configuration`;
    ExecuteCommand(`${FABRIC_NETWORK_FOLDER}/tools/fabric-${HYPERLEDGER_FABRIC_VERSION}/configtxgen -profile OrgsChannel -outputCreateChannelTx ${network_location}/configuration/channel-artifacts/channel.tx -channelID ${configuration['channel']}`);

    console.log('Channel configuration file generated successfully');
}

function GenerateAnchorPeersUpdateFiles(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Generating anchor peers update files...');

    env['FABRIC_CFG_PATH'] = `${network_location}/configuration`;
    for (const organization of configuration['organizations']) {
        ExecuteCommand(`${FABRIC_NETWORK_FOLDER}/tools/fabric-${HYPERLEDGER_FABRIC_VERSION}/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate ${network_location}/configuration/channel-artifacts/${ReplaceSpacesAndCapitalizeFirstLetterOnly(organization['name'])}Anchors.tx -channelID ${configuration['channel']} -asOrg ${ReplaceSpacesAndCapitalizeFirstLetterOnly(organization['name'])}Peers`);
        console.log(`+ ${ReplaceSpacesAndCapitalizeFirstLetterOnly(organization['name'])}Anchors.tx generated`);
    }

    console.log('Anchor peers update files generated successfully');
}

function StartOrderersAndPeersOfAllOrganizations(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Starting orderers and peers of all organizations...');

    // TODO: Start containers in parallel tasks
    for (const organization of configuration['organizations']) {
        console.log(`+ Starting containers for organization: ${organization['name']}`);
        ExecuteCommand(`docker-compose -f ${network_location}/configuration/network/${organization['name']}.yaml up -d`);
    }

    console.log('All orderers and peers were started successfully');

    console.log('Sleeping 5 seconds...');
    ExecuteCommand('sleep 5');
}

function CreateChannel(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Creating channel...');
    console.log('NOTE: We rely on first designated organization for this task');

    const first_organization: FabricOrganization = configuration['organizations'][0];
    const peer: FabricParticipant = first_organization['peers']['participants'].find((p: FabricParticipant) => p['name'] === first_organization['cli']) as FabricParticipant;
    const peer_tls_msp: string = `/opt/gopath/src/github.com/hyperledger/fabric/peers/${peer['name']}/tls-msp`;
    const orderer: FabricParticipant = first_organization['orderers']['participants'][0];
    console.log(`Peer: ${peer['name']}`);
    console.log(`Orderer: ${orderer['name']}`);
    ExecuteCommand(`docker exec ${ReplaceSpacesAndRemoveUppercases(first_organization['name'])}-cli bash -c 'CORE_PEER_ADDRESS=${ReplaceSpacesAndRemoveUppercases(first_organization['name'])}-${peer['name']}:${peer['port']} CORE_PEER_TLS_CERT_FILE=${peer_tls_msp}/signcerts/cert.pem CORE_PEER_TLS_KEY_FILE=${peer_tls_msp}/keystore/key.pem CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_msp}/tlscacerts/tls-cert.pem peer channel create -c ${configuration['channel']} -f /opt/gopath/src/github.com/hyperledger/fabric/channel-artifacts/channel.tx --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/channel-artifacts/channel.block -o ${ReplaceSpacesAndRemoveUppercases(first_organization['name'])}-${orderer['name']}:${orderer['port']} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/orderers/msp/tlscacerts/tls-cert.pem'`);

    console.log('Channel created successfully');
}

function ConnectOrganizationsToChannel(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Connect organizations to channel...');

    for (const organization of configuration['organizations']) {
        console.log(`+ Connecting organization: ${organization['name']}`);
        for (const peer of organization['peers']['participants']) {
            const tls_msp: string = `/opt/gopath/src/github.com/hyperledger/fabric/peers/${peer['name']}/tls-msp`;
            ExecuteCommand(`docker exec ${ReplaceSpacesAndRemoveUppercases(organization['name'])}-cli bash -c 'CORE_PEER_ADDRESS=${ReplaceSpacesAndRemoveUppercases(organization['name'])}-${peer['name']}:${peer['port']} CORE_PEER_TLS_CERT_FILE=${tls_msp}/signcerts/cert.pem CORE_PEER_TLS_KEY_FILE=${tls_msp}/keystore/key.pem CORE_PEER_TLS_ROOTCERT_FILE=${tls_msp}/tlscacerts/tls-cert.pem peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/channel-artifacts/channel.block'`);
        }
    }

    console.log('All organizations were connected to channel successfully');
}

function UpdateAnchorPeers(network_location: string, configuration: FabricNetworkInstallationConfiguration): void {
    console.log('** Updating all anchor peers...');

    for (const organization of configuration['organizations']) {
        console.log(`+ Updating anchor peers of organization: ${organization['name']}`);
        const peer: FabricParticipant = organization['peers']['participants'].find((p: FabricParticipant) => p['name'] === organization['cli']) as FabricParticipant;
        const peer_tls_msp: string = `/opt/gopath/src/github.com/hyperledger/fabric/peers/${peer['name']}/tls-msp`;
        const orderer: FabricParticipant = organization['orderers']['participants'][0];
        console.log(`Peer: ${peer['name']}`);
        console.log(`Orderer: ${orderer['name']}`);
        ExecuteCommand(`docker exec ${ReplaceSpacesAndRemoveUppercases(organization['name'])}-cli bash -c 'CORE_PEER_ADDRESS=${ReplaceSpacesAndRemoveUppercases(organization['name'])}-${peer['name']}:${peer['port']} CORE_PEER_TLS_CERT_FILE=${peer_tls_msp}/signcerts/cert.pem CORE_PEER_TLS_KEY_FILE=${peer_tls_msp}/keystore/key.pem CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_msp}/tlscacerts/tls-cert.pem peer channel update -c channel -f /opt/gopath/src/github.com/hyperledger/fabric/channel-artifacts/${ReplaceSpacesAndCapitalizeFirstLetterOnly(organization['name'])}Anchors.tx -o ${ReplaceSpacesAndRemoveUppercases(organization['name'])}-${orderer['name']}:${orderer['port']} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/orderers/msp/tlscacerts/tls-cert.pem'`);
    }

    console.log('All anchor peers updated successfully');
}

function ManageNetworkStructure(network_location: string): void {
    ExecuteCommand(`bash -c 'chown $SUDO_USER:$SUDO_USER -R ${network_location}'`);
}