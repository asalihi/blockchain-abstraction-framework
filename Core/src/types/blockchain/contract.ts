import { GenericObject, Identifier } from '@core/types/types';

/* CONTRACT */
export const ContractStateValues = ['inactive', 'installing', 'updating', 'deployed'];
export type ContractState = typeof ContractStateValues[number];
export type ContractOptions = GenericObject;
export type ContractReference = Identifier;
export type ContractVersion = { contract: Identifier, version: Identifier, reference?: ContractReference, state: ContractState };
export type ContractVersions = ContractVersion[];
export type Contract = { identifier: Identifier, instance: Identifier, network: Identifier, state: ContractState, metadata?: GenericObject, options?: ContractOptions, versions?: ContractVersions };

/* CONTRACT OPERATION */
export type ContractOperation = { identifier: Identifier, contract: ContractReference, version: Identifier, date: number, reference?: Identifier };
export type AbstractedContractOperation = ContractOperation & { caller: Identifier };
export const ContractInvocationTypeValues = ['call', 'execution'];
export type ContractInvocationType = typeof ContractInvocationTypeValues[number];
export type ContractInvocationParameters = any[];
export type ContractInvocation = AbstractedContractOperation & { type: ContractInvocationType, function: Identifier, parameters?: ContractInvocationParameters, response?: any };
export const ContractManagementTypeValues = ['registration', 'installation', 'update', 'deactivation'];
export type ContractManagementType = typeof ContractManagementTypeValues[number];
export type ContractManagement = AbstractedContractOperation & { type: ContractManagementType };
export type ContractOperationType = ContractInvocationType | ContractManagementType;
export type RawContractOperation = ContractOperation & { type: ContractOperationType, submission: any };

/* CONTRACT OPERATION TASK */
export type ContractOperationTaskActions = GenericObject;
export type ContractOperationTaskOptions = GenericObject;
export const ContractOperationTaskStateValues = ['inactive', 'submitted', 'executed', 'error'];
export type ContractOperationTaskState = typeof ContractOperationTaskStateValues[number];
export type ContractOperationTask = { identifier: Identifier, instance: Identifier, network: Identifier, registration: number, operation: Identifier, actions?: ContractOperationTaskActions, options?: ContractOperationTaskOptions, state: ContractOperationTaskState, metadata?: GenericObject };

/* CONTRACT TEMPLATE */
export const ContractTemplateStateValues = ['deactivated', 'active'];
export type ContractTemplateState = typeof ContractTemplateStateValues[number];
export type PlatformSupportingContractTemplate = { identifier: Identifier, languages: Identifier[] };
export const ContractTemplateVariableTypeValues = ['string', 'integer', 'real', 'double', 'boolean'];
export type ContractTemplateVariableType = typeof ContractTemplateVariableTypeValues[number];
export const ContractTemplateAttributeVisibilityValues = ['private', 'protected', 'public'];
export type ContractTemplateAttributeVisibility = typeof ContractTemplateAttributeVisibilityValues[number];
export type ContractTemplateAttribute = { name: Identifier, description: string, default: any, type: ContractTemplateVariableType, visibility: ContractTemplateAttributeVisibility };
export type ContractTemplateFunctionParameter = ContractTemplateAttribute & { optional: boolean };
export type ContractTemplateFunctionEvent = { name: Identifier, description: string, data: any };
export type ContractTemplateFunctionReturn = { type: ContractTemplateVariableType, description: string, data: any };
export const ContractTemplateFunctionTypeValues = ['query', 'execution'];
export type ContractTemplateFunctionType = typeof ContractTemplateFunctionTypeValues[number];
export type ContractTemplateFunction = { name: Identifier, description: string, parameters?: ContractTemplateFunctionParameter[], events?: ContractTemplateFunctionEvent[], return?: ContractTemplateFunctionReturn, type: ContractTemplateFunctionType };
export type ContractInterface = { attributes?: ContractTemplateAttribute[], functions: ContractTemplateFunction[] };
export type ContractTemplate = { identifier: Identifier, name: string, version: number, state: ContractTemplateState, platforms: PlatformSupportingContractTemplate[], description: string, interface: ContractInterface };