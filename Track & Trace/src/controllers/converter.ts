import { has } from 'lodash';
import { xml2js, ElementCompact } from 'xml-js';
import { fileSync as generate_temp_file, FileResult } from 'tmp';
import { basename, dirname } from 'path';

import { ProcessStartEvent, ProcessGatewayObject, ProcessTaskObject, ProcessEventObject, ProcessConnectionObject, ConvertArrayToObject, ExecuteShellCommand, RemoveKeys, WriteFile, ProcessConnectionClass, ProcessEventClass, ProcessGatewayClass, ProcessDivergentGatewayClass, ProcessConvergentGatewayClass, ProcessTaskClass, Maybe, Nullable, Identifier, ShellExecutionResults, ProcessLevelType, ListOfProcessElementInstances, ListOfProcessConnectionInstances, TreeOfProcessObjects, TreeOfProcessInstances, CamundaProperty, RawProcessFlow, RawProcessStartEvent, RawProcessStartEventWithoutBPMNNamespace, RawProcessEndEvent, RawProcessEndEventWithoutBPMNNamespace, RawProcessGateway, RawProcessGatewayWithoutBPMNNamespace, RawProcessSequenceFlow, RawProcessTask, RawProcessTaskWithoutBPMNNamespace, RawProcessWithoutBPMNNamespace, RawProcessWithBPMNNamespace, ProcessIdentifierAttribute, ProcessGatewayType, ProcessGateway, ProcessTask, ProcessFlowEndpoints, ListOfProcessFlows, Process, ProcessVersionOptions, ProcessControlObject, ProcessStandardControlClass, ProcessStandardControlObject, ProcessKeyControlClass, ProcessKeyControlObject, ProcessCompensatingControlClass, ProcessCompensatingControlObject, ProcessElementClass, ProcessExecutableElementClass, ProcessControlClass, ProcessTaskDefinition, ProcessCompensatingControlTypeDefinition, ProcessKeyControlTypeDefinition, ProcessControlDefinition } from 'core';

export async function ValidateProcess(process_as_xml: string): Promise<boolean> {
    try {
        const file: FileResult = generate_temp_file({ postfix: '.bpmn' });
        WriteFile({ 'location': dirname(file['name']), 'name': basename(file['name']) }, process_as_xml);
        const result: ShellExecutionResults = await ExecuteShellCommand(`npx bpmnlint ${file['name']}`);
        file.removeCallback();
        return (result['code'] === 0) ? true : false;
    } catch {
        return false;
    }
}

export async function ConvertProcess(process_as_xml: string): Promise<Process> {
    /* TODO IMMEDIATELY: Uncomment
    if (!await ValidateProcess(process_as_xml)) {
        throw new Error('Bad process');
    }
    */

    const process_as_object: ElementCompact = xml2js(process_as_xml, { compact: true, alwaysArray: true });

    if (process_as_object?.['bpmn:definitions']) return ConvertRawProcessWithBPMNNamespace(process_as_object);
    else return ConvertRawProcessWithoutBPMNNamespace(process_as_object);
}

export function SanitizeProcess(process: Process, process_version_options?: ProcessVersionOptions): Process {
    const sanitized_process: Process = Object.assign({ identifier: process['identifier'] }, { 'start': {}, 'end': {}, 'flows': {}, 'tasks': {}, 'gateways': {} });
    const elements_to_consider: string[] = [];
    const elements_considered: string[] = [];
    const elements_to_exclude: string[] = process_version_options?.['excluded'] ?? [];

    // initialization: start events
    for (const [identifier, flows] of Object.entries<ProcessStartEvent>(process['start']!)) {
        sanitized_process['start'][identifier] = flows;
        for (const flow of flows['outgoing']) {
            const flow_endpoints: ProcessFlowEndpoints = process['flows'][flow];
            sanitized_process['flows'][flow] = process['flows'][flow];
            elements_to_consider.push(flow_endpoints['target']);
        }
        elements_considered.push(identifier);
    }

    // processing
    while (elements_to_consider.length > 0) {
        const identifier: string = elements_to_consider.shift()!;

        if (elements_considered.includes(identifier)) continue;
        else elements_considered.push(identifier);

        if (process['tasks'][identifier]) {
            const task: ProcessTask = process['tasks'][identifier];
            if (!elements_to_exclude.includes(identifier)) {
                sanitized_process['tasks'][identifier] = { 'incoming': [], 'outgoing': task['outgoing'] };
                sanitized_process['flows'][task['outgoing'][0]] = process['flows'][task['outgoing'][0]];
            } else {
                const flows_with_task_as_destination: string[] = Object.keys(sanitized_process['flows']).filter((flow_identifier: string) => sanitized_process['flows'][flow_identifier]['target'] === identifier);
                const closest_child_candidate = FindFlowToTheClosestSelectedChild(process, identifier, elements_considered, elements_to_exclude);
                for (const flow of flows_with_task_as_destination) sanitized_process['flows'][flow]['target'] = closest_child_candidate;
            }
            elements_to_consider.push(...task['outgoing'].map((flow: string) => process['flows'][flow]['target']));
        } else if ( process['gateways'][identifier]) {
            const gateway: ProcessGateway = process['gateways'][identifier];
            sanitized_process['gateways'][identifier] = { 'incoming': [], 'outgoing': gateway['outgoing'], 'type': gateway['type'], 'behavior': gateway['behavior'] };
            for (const flow_with_gateway_as_source of Object.keys(process['flows']).filter((flow_identifier: string) => process['flows'][flow_identifier]['source'] === identifier)) {
                const closest_child_candidate = FindFlowToTheClosestSelectedChild(process, process['flows'][flow_with_gateway_as_source]['target'], elements_considered, elements_to_exclude);
                sanitized_process['flows'][flow_with_gateway_as_source] = Object.assign(process['flows'][flow_with_gateway_as_source], { 'target': closest_child_candidate });
            }
            elements_to_consider.push(...gateway['outgoing'].map((flow_identifier: string) => process['flows'][flow_identifier]['target']));
        } else if (process['end'][identifier]) {
            sanitized_process['end'][identifier] = process['end'][identifier];
        }
    }

    // inscription of incoming links for tasks and gateways, and sources for flows, when needed
    for (const [task_identifier, properties] of Object.entries<ProcessTask>(sanitized_process['tasks'])) {
        const flows_pointing_to_task: string[] = Object.keys(sanitized_process['flows']).filter((flow_identifier: string) => sanitized_process['flows'][flow_identifier]['target'] === task_identifier);
        properties['incoming'] = flows_pointing_to_task;
    }
    for (const [gateway_identifier, properties] of Object.entries<ProcessGateway>(sanitized_process['gateways'])) {
        const flows_pointing_to_gateway: string[] = Object.keys(sanitized_process['flows']).filter((flow_identifier: string) => sanitized_process['flows'][flow_identifier]['target'] === gateway_identifier);
        properties['incoming'] = flows_pointing_to_gateway;
    }
    for (const flow_identifier of Object.keys(sanitized_process['flows']).filter((flow_identifier: string) => sanitized_process['flows'][flow_identifier]['source'] === '')) {
        const source: string = (Object.keys(sanitized_process['tasks']).find((task_identifier: string) => sanitized_process['tasks'][task_identifier]['outgoing'].includes(flow_identifier)) ?? Object.keys(sanitized_process['gateways']).find((identifier: string) => sanitized_process['gateways'][identifier]['outgoing'].includes(flow_identifier))) as string;
        sanitized_process['flows'][flow_identifier]['source'] = source;
    }

    // cleaning process: removal of all gateways with dead branches
    for (const [gateway_identifier, properties] of Object.entries<ProcessGateway>(sanitized_process['gateways'])) {
        if (!(sanitized_process['gateways'][gateway_identifier])) continue;

        const common_child_for_all_outgoing_flows: string | false = VerifyIfAllOutgoingFlowsHaveTheSameChild(properties['outgoing'], sanitized_process['flows']);
        if ((properties['behavior'] === 'divergent') && common_child_for_all_outgoing_flows && sanitized_process['gateways'][common_child_for_all_outgoing_flows]['behavior'] === 'convergent' && properties['type'] === sanitized_process['gateways'][common_child_for_all_outgoing_flows]['type']) {
            Object.values<ProcessFlowEndpoints>(sanitized_process['flows']).filter((flow_endpoints: ProcessFlowEndpoints) => flow_endpoints['target'] === gateway_identifier).forEach((flow_endpoints: ProcessFlowEndpoints) => flow_endpoints['target'] = sanitized_process['flows'][sanitized_process['gateways'][common_child_for_all_outgoing_flows as string]['outgoing'][0]]['target']);
            sanitized_process['flows'] = RemoveKeys(sanitized_process['flows'], [...properties['outgoing'], ...sanitized_process['gateways'][common_child_for_all_outgoing_flows]['outgoing']]);
            sanitized_process['gateways'] = RemoveKeys(sanitized_process['gateways'], [gateway_identifier, common_child_for_all_outgoing_flows]);
        }
    }

    return sanitized_process;
}

export function ConvertTreeOfObjects(tree_of_objects: TreeOfProcessObjects): TreeOfProcessInstances {
    const elements: ListOfProcessElementInstances = {};

    for (const gateway of Object.values<ProcessGatewayObject>(tree_of_objects['gateways'])) {
        switch (gateway['behavior']) {
            case 'divergent': {
                elements[gateway['identifier']] = ProcessDivergentGatewayClass.from_object(gateway);
                break;
            }
            case 'convergent': {
                elements[gateway['identifier']] = ProcessConvergentGatewayClass.from_object(gateway);
                break;
            }
        }
    }

    for (const task of Object.values<ProcessTaskObject>(tree_of_objects['tasks'])) {
        if (task['element'] === 'control') {
            switch ((task as ProcessControlObject)['type']) {
                case 'key': {
                    elements[task['identifier']] = ProcessKeyControlClass.from_object(task as ProcessKeyControlObject);
                    break;
                }
                case 'compensating': {
                    elements[task['identifier']] = ProcessCompensatingControlClass.from_object(task as ProcessCompensatingControlObject);
                    break;
                }
                case 'standard': {
                    elements[task['identifier']] = ProcessStandardControlClass.from_object(task as ProcessStandardControlObject);
                    break;
                }
            }
        } else {
            elements[task['identifier']] = ProcessTaskClass.from_object(task);
        }
    }

    for (const event of Object.values<ProcessEventObject>(tree_of_objects['events'])) {
        elements[event['identifier']] = ProcessEventClass.from_object(event);
    }

    const connections: ListOfProcessConnectionInstances = {};

    for (const connection of Object.values<ProcessConnectionObject>(tree_of_objects['connections'] ?? {})) {
        connections[connection['identifier']] = ProcessConnectionClass.from_object(connection);
    }

    return { 'elements': elements, 'connections': connections };
}

export function ConvertTreeOfInstances(tree_of_instances: TreeOfProcessInstances): TreeOfProcessObjects {
    const tree_of_objects: Partial<TreeOfProcessObjects> = { 'gateways': {}, 'tasks': {}, 'events': {}, 'connections': {} };

    for (const gateway of Object.values(tree_of_instances['elements']).filter((element: ProcessElementClass) => element instanceof ProcessGatewayClass) as ProcessGatewayClass[]) {
        tree_of_objects['gateways']![gateway.get_identifier()] = (gateway instanceof ProcessDivergentGatewayClass) ? ProcessDivergentGatewayClass.to_object(gateway) : ProcessConvergentGatewayClass.to_object(gateway);
    }

    for (const task of Object.values(tree_of_instances['elements']).filter((element: ProcessElementClass) => element instanceof ProcessExecutableElementClass) as ProcessExecutableElementClass[]) {
        if (task instanceof ProcessTaskClass) {
            tree_of_objects['tasks']![task.get_identifier()] = ProcessTaskClass.to_object(task);
        } else if (task instanceof ProcessControlClass) {
            if (task instanceof ProcessKeyControlClass) tree_of_objects['tasks']![task.get_identifier()] = ProcessKeyControlClass.to_object(task);
            else if (task instanceof ProcessCompensatingControlClass) tree_of_objects['tasks']![task.get_identifier()] = ProcessCompensatingControlClass.to_object(task);
            else if (task instanceof ProcessStandardControlClass) tree_of_objects['tasks']![task.get_identifier()] = ProcessStandardControlClass.to_object(task);
        }
    }

    for (const event of Object.values(tree_of_instances['elements']).filter((element: ProcessElementClass) => element instanceof ProcessEventClass) as ProcessEventClass[]) {
        tree_of_objects['events']![event.get_identifier()] = ProcessEventClass.to_object(event);
    }

    for (const connection of Object.values<ProcessConnectionClass>(tree_of_instances['connections'])) {
        tree_of_objects['connections']![connection.get_identifier()] = ProcessConnectionClass.to_object(connection);
    }

    return tree_of_objects as TreeOfProcessObjects;
}

function ConvertGateways(gateways: RawProcessGateway[], type: ProcessGatewayType): (ProcessIdentifierAttribute & ProcessGateway)[] {
    return gateways.map((gateway: RawProcessGateway) => Object.assign({}, { identifier: gateway['_attributes']['id'], incoming: gateway['bpmn:incoming'].map((incoming: RawProcessFlow) => incoming['_text'].pop()), outgoing: gateway['bpmn:outgoing'].map((outgoing: RawProcessFlow) => outgoing['_text'].pop()), 'type': type, 'behavior': gateway['bpmn:outgoing'].length > 1 ? 'divergent' : 'convergent' })) as (ProcessIdentifierAttribute & ProcessGateway)[];
}

function ConvertGatewaysWithoutBPMNNamespace(gateways: RawProcessGatewayWithoutBPMNNamespace[], type: ProcessGatewayType): (ProcessIdentifierAttribute & ProcessGateway)[] {
    return gateways.map((gateway: RawProcessGatewayWithoutBPMNNamespace) => Object.assign({}, { identifier: gateway['_attributes']['id'], incoming: gateway['incoming'].map((incoming: RawProcessFlow) => incoming['_text'].pop()), outgoing: gateway['outgoing'].map((outgoing: RawProcessFlow) => outgoing['_text'].pop()), 'type': type, 'behavior': gateway['outgoing'].length > 1 ? 'divergent' : 'convergent' })) as (ProcessIdentifierAttribute & ProcessGateway)[];
}

function ConvertRawProcessWithBPMNNamespace(raw_process_as_object: ElementCompact): Process {
    const raw_process: RawProcessWithBPMNNamespace = raw_process_as_object['bpmn:definitions'].pop()['bpmn:process'].pop();
    const process: Partial<Process> = Object.assign({}, { 'identifier': raw_process['_attributes']['id'] });

    process['start'] = ConvertArrayToObject(raw_process['bpmn:startEvent'].map((event: RawProcessStartEvent) => Object.assign({}, { identifier: event['_attributes']['id'], outgoing: event['bpmn:outgoing'].map((outgoing: RawProcessFlow) => outgoing['_text'].pop()) })), 'identifier');
    process['end'] = ConvertArrayToObject(raw_process['bpmn:endEvent'].map((event: RawProcessEndEvent) => Object.assign({}, { identifier: event['_attributes']['id'], incoming: event['bpmn:incoming'].map((incoming: RawProcessFlow) => incoming['_text'].pop()) })), 'identifier');
    process['flows'] = ConvertArrayToObject(raw_process['bpmn:sequenceFlow'].map((flow: RawProcessSequenceFlow) => Object.assign({}, { identifier: flow['_attributes']['id'], source: flow['_attributes']['sourceRef'], target: flow['_attributes']['targetRef'] })), 'identifier');
    process['tasks'] = raw_process['bpmn:task'] ? ConvertArrayToObject(raw_process['bpmn:task'].map((task: RawProcessTask) => Object.assign({}, { identifier: task['_attributes']['id'], incoming: task['bpmn:incoming'].map((incoming: RawProcessFlow) => incoming['_text'].pop()), outgoing: task['bpmn:outgoing'].map((outgoing: RawProcessFlow) => outgoing['_text'].pop()) })), 'identifier') : [];
    process['gateways'] = { ...(raw_process['bpmn:exclusiveGateway'] && ConvertArrayToObject(ConvertGateways(raw_process['bpmn:exclusiveGateway'], 'exclusive'), 'identifier')), ...(raw_process['bpmn:inclusiveGateway'] && ConvertArrayToObject(ConvertGateways(raw_process['bpmn:inclusiveGateway'], 'inclusive'), 'identifier')), ...(raw_process['bpmn:parallelGateway'] && ConvertArrayToObject(ConvertGateways(raw_process['bpmn:parallelGateway'], 'parallel'), 'identifier')) };

    return process as Process;
}

function ConvertRawProcessWithoutBPMNNamespace(raw_process_as_object: ElementCompact): Process {
    const raw_process: RawProcessWithoutBPMNNamespace = raw_process_as_object['definitions'].pop()['process'].pop();
    const process: Partial<Process> = Object.assign({}, { identifier: raw_process['_attributes']['id'] });

    process['start'] = ConvertArrayToObject(raw_process['startEvent'].map((event: RawProcessStartEventWithoutBPMNNamespace) => Object.assign({}, { identifier: event['_attributes']['id'], outgoing: event['outgoing'].map((outgoing: RawProcessFlow) => outgoing['_text'].pop()) })), 'identifier');
    process['end'] = ConvertArrayToObject(raw_process['endEvent'].map((event: RawProcessEndEventWithoutBPMNNamespace) => Object.assign({}, { identifier: event['_attributes']['id'], incoming: event['incoming'].map((incoming: RawProcessFlow) => incoming['_text'].pop()) })), 'identifier');
    process['flows'] = ConvertArrayToObject(raw_process['sequenceFlow'].map((flow: RawProcessSequenceFlow) => Object.assign({}, { identifier: flow['_attributes']['id'], source: flow['_attributes']['sourceRef'], target: flow['_attributes']['targetRef'] })), 'identifier');
    process['tasks'] = raw_process['task'] ? ConvertArrayToObject(raw_process['task'].map((task: RawProcessTaskWithoutBPMNNamespace) => Object.assign({}, { identifier: task['_attributes']['id'], incoming: task['incoming'].map((incoming: RawProcessFlow) => incoming['_text'].pop()), outgoing: task['outgoing'].map((outgoing: RawProcessFlow) => outgoing['_text'].pop()) })), 'identifier') : {};
    process['gateways'] = { ...(raw_process['exclusiveGateway'] && ConvertArrayToObject(ConvertGatewaysWithoutBPMNNamespace(raw_process['exclusiveGateway'], 'exclusive'), 'identifier')), ...(raw_process['inclusiveGateway'] && ConvertArrayToObject(ConvertGatewaysWithoutBPMNNamespace(raw_process['inclusiveGateway'], 'inclusive'), 'identifier')), ...(raw_process['parallelGateway'] && ConvertArrayToObject(ConvertGatewaysWithoutBPMNNamespace(raw_process['parallelGateway'], 'parallel'), 'identifier')) };
    return process as Process;
}

function FindFlowToTheClosestSelectedChild(process: Process, starting_point: string, already_selected_elements: string[], list_of_excluded_elements: string[]): string {
    let current: string = starting_point;

    while (true) {
        // TODO IMMEDIATELY: Reconsider first verification of IF
        if ((!list_of_excluded_elements.includes(current)) || (process['gateways'][current]) || (process['end'][current]) || !already_selected_elements.includes(current)) {
            return current;
        } else {
            current = process['flows'][process['tasks'][current]['outgoing'][0]]['target'];
        }
    }
}

function VerifyIfAllOutgoingFlowsHaveTheSameChild(outgoing_flows: string[], list_of_flows: ListOfProcessFlows): string | false {
    if (outgoing_flows.length === 0) throw new Error('List of outgoing flows is empty'); // TODO: HANDLE ERROR

    const child_of_first_outgoing_flow: string = list_of_flows[outgoing_flows[0]]['target'];
    return (outgoing_flows.every((flow: string) => list_of_flows[flow]['target'] === child_of_first_outgoing_flow)) ? child_of_first_outgoing_flow : false;
}

export function CreateDependancyTree(process: Process, process_version_options?: ProcessVersionOptions): TreeOfProcessInstances {
    const all_elements_of_process: { [key: string]: ProcessElementClass } = {};

    for (const [gateway_identifier, properties] of Object.entries<ProcessGateway>(process['gateways'])) {
        all_elements_of_process[gateway_identifier] = (properties['behavior'] === 'divergent') ? new ProcessDivergentGatewayClass(gateway_identifier, properties['type']) : new ProcessConvergentGatewayClass(gateway_identifier, properties['type']);
    }

    for (const task_identifier of Object.keys(process['tasks'])) {
        const task_definition: Maybe<ProcessTaskDefinition> = process_version_options?.['tasks']?.find((definition: ProcessTaskDefinition) => definition['identifier'] === task_identifier);

        if (task_definition && has(task_definition, 'control')) {
            switch ((task_definition as ProcessControlDefinition)['control']) {
                case 'key': {
                    all_elements_of_process[task_identifier] = new ProcessKeyControlClass(task_identifier, (task_definition as ProcessKeyControlTypeDefinition)['reference']);
                    break;
                }
                case 'compensating': {
                    all_elements_of_process[task_identifier] = new ProcessCompensatingControlClass(task_identifier, (task_definition as ProcessCompensatingControlTypeDefinition)['reference']);
                    break;
                }
                case 'standard': {
                    all_elements_of_process[task_identifier] = new ProcessStandardControlClass(task_identifier);
                    break;
                }
            }
        } else {
            all_elements_of_process[task_identifier] = new ProcessTaskClass(task_identifier);
        }
    }

    for (const event_identifier of Object.keys(process['start'])) {
        all_elements_of_process[event_identifier] = new ProcessEventClass(event_identifier, 'start');
    }

    for (const event_identifier of Object.keys(process['end'])) {
        all_elements_of_process[event_identifier] = new ProcessEventClass(event_identifier, 'end');
    }

    const elements_to_consider: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>][] = [];
    const list_of_elements_considered: Identifier[] = [];
    const list_of_gateways: Identifier[] = [];
    const list_of_connections: { [key: string]: ProcessConnectionClass } = {};

    const head_level: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>] = [[], 'head', null];
    for (const start_event of Object.values(all_elements_of_process).filter((element: ProcessElementClass) => (element instanceof ProcessEventClass) && (element.get_type() === 'start'))) head_level[0].push(start_event.get_identifier());
    elements_to_consider.push(head_level);

    while (elements_to_consider.length > 0) {
        const level_to_consider: Array<Identifier> = elements_to_consider[elements_to_consider.length - 1][0];
        const identifier_of_element_to_consider: Identifier = level_to_consider.splice(0, 1).pop()!;
        const element_to_consider = all_elements_of_process[identifier_of_element_to_consider];

        if (element_to_consider instanceof ProcessGatewayClass) HandleGateway(element_to_consider, all_elements_of_process, process['flows'], elements_to_consider, list_of_elements_considered, list_of_gateways, list_of_connections);
        else if ((element_to_consider instanceof ProcessExecutableElementClass) || (element_to_consider instanceof ProcessEventClass)) HandleElement(element_to_consider, all_elements_of_process, process['flows'], elements_to_consider, list_of_elements_considered, list_of_gateways, list_of_connections);

        while (elements_to_consider[elements_to_consider.length - 1]?.[0].length === 0) elements_to_consider.pop();
    }

    for (const [identifier, connection] of Object.entries<ProcessConnectionClass>(list_of_connections)) {
        const reference_gateway: ProcessGatewayClass = all_elements_of_process[connection.get_gateway()] as ProcessGatewayClass;
        if (!reference_gateway.get_connections().includes(identifier)) reference_gateway.add_connection(identifier);
    }

    // TODO: Verify that (1) each compensating control has a reference to a key control which, itself, contains a link to that compensating control; (2) each compensating control is the immediate child of the key control it is associated to

    return { 'elements': all_elements_of_process, 'connections': list_of_connections };
}

function HandleElement(element: ProcessExecutableElementClass | ProcessEventClass, all_elements_of_process: { [key: string]: ProcessElementClass }, flows: ListOfProcessFlows, elements_to_consider: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>][], list_of_elements_considered: Identifier[], list_of_gateways: Identifier[], list_of_connections: { [key: string]: ProcessConnectionClass }): void {
    const element_identifier: Identifier = element.get_identifier();

    element.set_parents(GetAllParentsOfElement(element_identifier, flows));

    const child_of_element: Nullable<Identifier> = GetChildOfElement(element_identifier, flows);
    element.set_child(child_of_element);

    const level_to_consider: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>] = elements_to_consider[elements_to_consider.length - 1];
    switch (level_to_consider[1]) {
        case 'head': {
            if (child_of_element && !list_of_elements_considered.includes(child_of_element)) {
                // TODO: Remove (incorrect version)
                //list_of_elements_considered.push(child_of_element);
                level_to_consider[0].unshift(child_of_element);
                if (all_elements_of_process[child_of_element] instanceof ProcessGatewayClass) list_of_gateways.push(child_of_element);
            }

            break;
        }
        case 'gateway': {
            const gateway_identifier: Identifier = level_to_consider[2] as Identifier;
            const connection_identifier: Identifier = `${gateway_identifier}_to_${element_identifier}`;
            const child_is_a_convergent_gateway: boolean = (child_of_element !== null) && CheckIfElementIsAConvergentGateway(child_of_element, all_elements_of_process);
            const last_element_of_connection: Identifier = (child_of_element && !child_is_a_convergent_gateway) ? child_of_element : element_identifier;
            const connection: ProcessConnectionClass = new ProcessConnectionClass(connection_identifier, gateway_identifier, element_identifier, last_element_of_connection);
            list_of_connections[connection_identifier] = connection;
            (all_elements_of_process[gateway_identifier] as ProcessGatewayClass).add_connection(connection_identifier);

            if (child_of_element && !list_of_elements_considered.includes(child_of_element)) {
                if (child_is_a_convergent_gateway) {
                    if (!CheckIfElementIsInListOfElementsToConsider(child_of_element, elements_to_consider)) InsertConvergentGatewayInSameLevelAsReference(child_of_element, all_elements_of_process, flows, elements_to_consider, list_of_gateways);
                } else {
                    const connection_level: [Array<Identifier>, ProcessLevelType, Identifier] = [[], 'connection', connection_identifier];
                    connection_level[0].push(child_of_element);
                    elements_to_consider.push(connection_level);
                }

                if (all_elements_of_process[child_of_element] instanceof ProcessGatewayClass) list_of_gateways.push(child_of_element);
            }

            break;
        }
        case 'connection': {
            list_of_connections[level_to_consider[2] as Identifier].set_exit(element_identifier);

            if (child_of_element && !list_of_elements_considered.includes(child_of_element)) {
                const child_is_a_convergent_gateway: boolean = CheckIfElementIsAConvergentGateway(child_of_element, all_elements_of_process);
                if (child_is_a_convergent_gateway) {
                    if (!CheckIfElementIsInListOfElementsToConsider(child_of_element, elements_to_consider)) InsertConvergentGatewayInSameLevelAsReference(child_of_element, all_elements_of_process, flows, elements_to_consider, list_of_gateways);
                } else {
                    level_to_consider[0].unshift(child_of_element);
                }
                if (all_elements_of_process[child_of_element] instanceof ProcessGatewayClass) list_of_gateways.push(child_of_element);
            }

            break;
        }
    }

    list_of_elements_considered.push(element_identifier);
}

function HandleGateway(gateway: ProcessGatewayClass, all_elements_of_process: { [key: string]: ProcessElementClass }, flows: ListOfProcessFlows, elements_to_consider: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>][], list_of_elements_considered: Identifier[], list_of_gateways: Identifier[], list_of_connections: { [key: string]: ProcessConnectionClass }): void {
    const gateway_identifier: Identifier = gateway.get_identifier();
    const children_of_gateway: Identifier[] = GetAllChildrenOfElement(gateway_identifier, flows);

    gateway.set_parents(GetAllParentsOfElement(gateway_identifier, flows));

    if (gateway instanceof ProcessDivergentGatewayClass) {
        for (const child of children_of_gateway) {
            if (list_of_elements_considered.includes(child)) {
                const connection_identifier: Identifier = `${gateway_identifier}_to_${child}`;
                const connection: ProcessConnectionClass = new ProcessConnectionClass(connection_identifier, gateway_identifier, child, gateway_identifier);
                gateway.add_connection(connection_identifier);
                list_of_connections[connection_identifier] = connection;
            }
        }

        const gateway_level: [Array<Identifier>, ProcessLevelType, Identifier] = [[], 'gateway', gateway_identifier];
        elements_to_consider.push(gateway_level);
        for (const child_identifier of children_of_gateway) {
            if (list_of_elements_considered.includes(child_identifier)) {
                continue;
            } else {
                const child_element: ProcessElementClass = all_elements_of_process[child_identifier];

                if (child_element instanceof ProcessGatewayClass) {
                    const connection_identifier: Identifier = `${gateway_identifier}_to_${child_identifier}`;
                    // TODO IMMEDIATELY: Revert child_identifier to gateway_identifier if wrong results
                    const connection: ProcessConnectionClass = new ProcessConnectionClass(connection_identifier, gateway_identifier, child_identifier, child_identifier);
                    gateway.add_connection(connection_identifier);
                    list_of_connections[connection_identifier] = connection;
                }

                if (child_element instanceof ProcessConvergentGatewayClass) InsertConvergentGatewayInSameLevelAsReference(child_identifier, all_elements_of_process, flows, elements_to_consider, list_of_gateways);
                else gateway_level[0].unshift(child_identifier);
                
                if (all_elements_of_process[child_identifier] instanceof ProcessGatewayClass) list_of_gateways.push(child_identifier);
            }
        }
    } else {
        const level_being_considered: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>] = elements_to_consider.pop()!;
        const reference_of_level_being_considered: Identifier = level_being_considered[2] as Identifier;
        const divergent_gateway: ProcessDivergentGatewayClass = all_elements_of_process[reference_of_level_being_considered] as ProcessDivergentGatewayClass;
        gateway.add_reference(reference_of_level_being_considered);
        divergent_gateway.add_reference(gateway_identifier);
        gateway.set_connections(divergent_gateway.get_connections());

        // TODO: Transform the for to pop() as we should have only one child in array
        for (const child_identifier of children_of_gateway) {
            (gateway as ProcessConvergentGatewayClass).set_child(child_identifier);
            const child_element: ProcessElementClass = all_elements_of_process[child_identifier];
            if (child_element instanceof ProcessGatewayClass) list_of_gateways.push(child_identifier);

            if (list_of_elements_considered.includes(child_identifier)) {
                continue;
            } else {
                if (child_element instanceof ProcessGatewayClass) {
                    if (child_element instanceof ProcessConvergentGatewayClass) InsertConvergentGatewayInSameLevelAsReference(child_identifier, all_elements_of_process, flows, elements_to_consider, list_of_gateways);
                    else InsertGatewayInSameLevelAsDivergentGatewayOfSameTypeOrAtHeadLevel(child_identifier, all_elements_of_process, elements_to_consider);
                } else {
                    let level: number = elements_to_consider.length - 1;
                    while (elements_to_consider[level][1] === 'gateway') {
                        level--;
                    }
                    elements_to_consider[level][0].unshift(child_identifier);
                }
            }
        }
    }

    list_of_elements_considered.push(gateway_identifier);
}

function InsertConvergentGatewayInSameLevelAsReference(gateway_identifier: Identifier, all_elements_of_process: { [key: string]: ProcessElementClass }, flows: ListOfProcessFlows, elements_to_consider: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>][], list_of_gateways: Identifier[]): void {
    const levels_to_consider: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>][] = elements_to_consider.filter((level: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>]) => level[1] === 'gateway');
    levels_to_consider[levels_to_consider.length - 1][0].push(gateway_identifier);
}

function InsertGatewayInSameLevelAsDivergentGatewayOfSameTypeOrAtHeadLevel(gateway_identifier: Identifier, all_elements_of_process: { [key: string]: ProcessElementClass }, elements_to_consider: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>][]): void {
    const levels_to_consider: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>][] = elements_to_consider.filter((level: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>]) => level[1] === 'gateway');

    for (const level of levels_to_consider.reverse()) {
        level[0].unshift(gateway_identifier);
        return;
    }

    elements_to_consider[0][0].unshift(gateway_identifier);
}

function GetAllChildrenOfElement(identifier: Identifier, flows: ListOfProcessFlows): Identifier[] {
    return Object.values<ProcessFlowEndpoints>(flows).filter((endpoints: ProcessFlowEndpoints) => endpoints['source'] === identifier).map((endpoints: ProcessFlowEndpoints) => endpoints['target']);
}

function GetAllParentsOfElement(identifier: Identifier, flows: ListOfProcessFlows): Identifier[] {
    return Object.values<ProcessFlowEndpoints>(flows).filter((endpoints: ProcessFlowEndpoints) => endpoints['target'] === identifier).map((endpoints: ProcessFlowEndpoints) => endpoints['source']);
}

function GetChildOfElement(identifier: Identifier, flows: ListOfProcessFlows): Nullable<Identifier> {
    return Object.values<ProcessFlowEndpoints>(flows).find((endpoints: ProcessFlowEndpoints) => endpoints['source'] === identifier)?.['target'] || null;
}

function CheckIfElementIsAConvergentGateway(identifier: Identifier, all_elements_of_process: { [key: string]: ProcessElementClass }): boolean {
    const element: ProcessElementClass = all_elements_of_process[identifier];
    return element instanceof ProcessConvergentGatewayClass;
}

function CheckIfElementIsInListOfElementsToConsider(identifier: Identifier, elements_to_consider: [Array<Identifier>, ProcessLevelType, Nullable<Identifier>][]): boolean {
    for (const level of elements_to_consider) {
        if (level[0].includes(identifier)) return true;
    }

    return false;
}