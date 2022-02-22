import { GenericObject, Identifier, FabricNetworkConfiguration, FabricNetworkInstallationConfiguration, DLTInstanceProfile, DEFAULT_FABRIC_NETWORK_PARAMETERS, DEFAULT_FABRIC_NETWORK_PROFILE } from 'core';
import { CreateDLTInstanceEntry, IFabricNetworkModel, GetDLTInstanceEntry } from '@service/database/schemata';
import { InstallationConfigurationValidator } from '@service/controllers/connectors/fabric/schemata';
import { DeployNetwork } from './deployer';
import { StartNetwork } from './manager';

async function DeployInstance(identifier: Identifier, provided_configuration?: GenericObject): Promise<void> {
    try {
        if(provided_configuration) {
            if(!InstallationConfigurationValidator(provided_configuration)) throw new Error('Invalid Fabric installation configuration');
        }
    
        const installation_configuration: FabricNetworkInstallationConfiguration = (provided_configuration as FabricNetworkInstallationConfiguration) ?? DEFAULT_FABRIC_NETWORK_PARAMETERS;
        
        const profile: DLTInstanceProfile = DEFAULT_FABRIC_NETWORK_PROFILE;
    
        // TODO: Add support for multiple organizations, etc.
        const configuration: FabricNetworkConfiguration = { type: 'docker', 'channels': { [installation_configuration['channel']]: { state: 'inactive', participants: [], contracts: {}, creation: Date.now() }}, organization: installation_configuration['organizations'][0] };
    
        console.log('Creating DLT instance entry...');
    
        // Creation of the instance in the database
        await CreateDLTInstanceEntry({ network: 'fabric', identifier, configuration, profile });
    
        console.log('DLT instance entry created successfully');
    
        // TODO: Handle update of instance entry
        const instance: IFabricNetworkModel = await GetDLTInstanceEntry(identifier, 'fabric') as IFabricNetworkModel;
        instance.set('state', 'installing');
        instance.set(`configuration.channels.${installation_configuration['channel']}.state`, 'initializing');
        instance.markModified('configuration');
        await instance.save();
    
        console.log('Deploying network...');
        DeployNetwork(installation_configuration);
        console.log('Network deployed successfully');
        
        console.log('Starting network...');
        await StartNetwork(installation_configuration);
        console.log('Network started successfully');
    
        // TODO: Handle update of instance entry
        instance.set('state', 'active');
        instance.set(`configuration.channels.${installation_configuration['channel']}.state`, 'active');
        instance.markModified('configuration');
        await instance.save();
    
        console.log('Fabric instance successfully deployed');
    } catch(error) {
        console.log('Error during deployment of Fabric instance');
        console.log(error);
    }
}

export { DeployInstance as DeployFabricInstance };