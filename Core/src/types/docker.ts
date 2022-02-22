export type ListOfDockerComposeFiles = { [key: string]: DockerComposeFile };
export type DockerEnvironment = string[];
export type DockerVolumes = string[];
export type DockerNetworks = { [key: string]: null };
export type DockerPorts = string[];
export type DockerServiceDefinition = {
	'container_name': string,
	'image': string,
	'command': string,
	'working_dir'?: string,
	'tty'?: Boolean,
	'stdin_open'?: Boolean,
	'environment': DockerEnvironment,
	'volumes': DockerVolumes,
	'networks': DockerNetworks,
	'ports'?: DockerPorts,
}
export type DockerServiceNameWithDefinition = { name: string, definition: DockerServiceDefinition };
export type DockerComposeFile = {
	'version': string,
	'networks': DockerNetworks,
	'services': { [key: string]: DockerServiceDefinition }
};