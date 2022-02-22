import { ProcessConnectionObject, ProcessGatewayBehavior, ProcessGatewayType, ProcessGatewayObject, ProcessElementObject, ProcessExecutableElementObject, ProcessTaskObject, ProcessKeyControlObject, ProcessCompensatingControlObject, ProcessStandardControlObject, ProcessControlType, ProcessEventType, ProcessEventObject, ProcessStandardTaskObject, ProcessControlObject, ProcessControlBaseObject } from './process';
import { Maybe, Nullable, Identifier } from '@core/types/types';

/* PROCESS CONNECTION */
interface IProcessConnection {
	get_identifier: () => Identifier,
	get_gateway: () => Identifier,
	get_entry: () => Identifier,
	get_exit: () => Identifier
}

export class ProcessConnectionClass implements IProcessConnection {
	private readonly element: string = 'connection';
	private identifier: Identifier;
	private gateway: Identifier;
	private entry: Identifier;
	private exit: Identifier;

	constructor(identifier: Identifier, gateway: Identifier, entry: Identifier, exit: Identifier) {
		this.identifier = identifier;
		this.gateway = gateway;
		this.entry = entry;
		this.exit = exit;
	}

	public get_identifier(): Identifier {
		return this.identifier;
	}

	public get_gateway(): Identifier {
		return this.gateway;
	}

	public get_entry(): Identifier {
		return this.entry;
	}

	public set_entry(entry: Identifier): void {
		this.entry = entry;
	}

	public get_exit(): Identifier {
		return this.exit;
	}

	public set_exit(exit: Identifier): void {
		this.exit = exit;
	}

	static from_object(connection_as_object: ProcessConnectionObject): ProcessConnectionClass {
		return new ProcessConnectionClass(connection_as_object['identifier'], connection_as_object['gateway'], connection_as_object['first_element'], connection_as_object['last_element']);
	}

	static to_object(connection: ProcessConnectionClass): ProcessConnectionObject {
		return { 'identifier': connection.get_identifier(), 'gateway': connection.get_gateway(), 'first_element': connection.get_entry(), 'last_element': connection.get_exit() };
	}
}


/* PROCESS ELEMENT */
interface IProcessElement {
	get_identifier: () => Identifier,
	get_parents: () => Identifier[]
}

type ProcessElementType = ProcessExecutableElementType | 'gateway' | 'event';

export abstract class ProcessElementClass implements IProcessElement {
	protected identifier: Identifier;
	protected abstract element: ProcessElementType;
	protected list_of_parents: Identifier[] = [];

	constructor(identifier: Identifier) {
		this.identifier = identifier;
	}

	public get_identifier(): Identifier {
		return this.identifier;
	}

	public get_element_type(): string {
		return this.element;
	}

	public get_parents(): Identifier[] {
		return this.list_of_parents;
	}

	public set_parents(parents: Identifier[]): void {
		this.list_of_parents = parents;
	}

	static to_object(element: ProcessElementClass): ProcessElementObject {
		return { 'identifier': element.get_identifier(), 'list_of_parents': element.get_parents() };
	}
}


/* PROCESS GATEWAY */
interface IProcessGateway {
	get_reference: () => Nullable<Identifier>;
	add_reference: (reference: Identifier) => void;
	get_parents: () => Identifier[];
	set_parents: (parents: Identifier[]) => void;
	get_connections: () => Identifier[];
	add_connection: (connection: Identifier) => void;
	set_connections: (connections: Identifier[]) => void;
}

export abstract class ProcessGatewayClass extends ProcessElementClass implements IProcessGateway {
	protected readonly element: ProcessElementType = 'gateway';
	protected type: ProcessGatewayType;
	protected readonly behavior: ProcessGatewayBehavior;
	protected reference: Nullable<Identifier> = null;
	protected list_of_parents: Identifier[] = [];
	protected list_of_connections: Identifier[] = [];

	constructor(identifier: Identifier, type: ProcessGatewayType, behavior: ProcessGatewayBehavior) {
		super(identifier);
		this.type = type;
		this.behavior = behavior;
	}

	public get_element_type(): string {
		return this.element;
    }

	public get_identifier(): Identifier {
		return this.identifier;
	}

	public get_type(): ProcessGatewayType {
		return this.type;
	}

	public get_behavior(): ProcessGatewayBehavior {
		return this.behavior;
	}

	public get_reference(): Nullable<Identifier> {
		return this.reference;
	}

	public add_reference(reference: Identifier): void {
		this.reference = reference;
	}

	public get_parents(): Identifier[] {
		return this.list_of_parents;
	}

	public set_parents(parents: Identifier[]): void {
		this.list_of_parents = parents;
	}

	public get_connections(): Identifier[] {
		return this.list_of_connections;
	}

	public add_connection(connection: Identifier): void {
		this.list_of_connections.push(connection);
	}

	public set_connections(connections: Identifier[]): void {
		this.list_of_connections = connections;
	}

	public static from_object(gateway_as_object: ProcessGatewayObject): ProcessGatewayClass {
		let gateway: ProcessGatewayClass = (gateway_as_object['behavior'] === 'divergent') ? new ProcessDivergentGatewayClass(gateway_as_object['identifier'], gateway_as_object['type']) : new ProcessConvergentGatewayClass(gateway_as_object['identifier'], gateway_as_object['type']);
		if (gateway_as_object['reference']) gateway.add_reference(gateway_as_object['reference']);
		gateway.set_parents(gateway_as_object['list_of_parents']);
		gateway.set_connections(gateway_as_object['list_of_connections']);
		if (gateway instanceof ProcessConvergentGatewayClass) gateway.set_child(gateway_as_object['child']!);
		return gateway;
	}

	public static to_object(gateway: ProcessGatewayClass): ProcessGatewayObject {
		return { 'identifier': gateway.get_identifier(), 'type': gateway.get_type(), 'behavior': gateway.get_behavior(), 'reference': gateway.get_reference(), 'list_of_parents': gateway.get_parents(), 'list_of_connections': gateway.get_connections(), ...(gateway instanceof ProcessConvergentGatewayClass && { 'child': gateway.get_child() as Identifier }) };
	}
}

export class ProcessDivergentGatewayClass extends ProcessGatewayClass {
	constructor(identifier: Identifier, type: ProcessGatewayType) {
		super(identifier, type, 'divergent');
	}
}

interface IProcessConvergentGateway extends IProcessGateway {
	get_child: () => Nullable<Identifier>;
	set_child: (child: Identifier) => void;
};

export class ProcessConvergentGatewayClass extends ProcessGatewayClass implements IProcessConvergentGateway {
	private child: Nullable<Identifier> = null;

	constructor(identifier: Identifier, type: ProcessGatewayType) {
		super(identifier, type, 'convergent');
	}

	public get_child(): Nullable<Identifier> {
		return this.child;
	}

	public set_child(child: Identifier): void {
		this.child = child;
	}
}


/* PROCESS EXECUTABLE ELEMENT */
type ProcessExecutableElementType = 'task' | 'control';

export abstract class ProcessExecutableElementClass extends ProcessElementClass {
	protected abstract readonly element: ProcessExecutableElementType;
	protected child_element: Nullable<Identifier> = null;

	constructor(identifier: Identifier) {
		super(identifier);
	}

	public get_child(): Nullable<Identifier> {
		return this.child_element;
	}

	public set_child(child: Nullable<Identifier>): void {
		this.child_element = child;
	}

	static to_object(element: ProcessExecutableElementClass): ProcessExecutableElementObject {
		return Object.assign(ProcessElementClass.to_object(element as ProcessElementClass), { 'child': element.get_child() as Identifier });
    }
}


/* PROCESS TASK */
export class ProcessTaskClass extends ProcessExecutableElementClass {
	protected readonly element: ProcessExecutableElementType = 'task';

	constructor(identifier: Identifier) {
		super(identifier);
	}

	public get_element_type(): string {
		return this.element;
	}

	public get_child(): Identifier {
		return this.child_element as Identifier;
	}

	static from_object(task_as_object: ProcessTaskObject): ProcessTaskClass {
		let task: ProcessTaskClass = new ProcessTaskClass(task_as_object['identifier']);
		task.set_parents(task_as_object['list_of_parents']);
		task.set_child(task_as_object['child']);
		return task;
	}

	static to_object(task: ProcessTaskClass): ProcessStandardTaskObject {
		return Object.assign(ProcessExecutableElementClass.to_object(task as ProcessTaskClass), { 'element': task.get_element_type() }) as ProcessStandardTaskObject;
	}
}


/* PROCESS CONTROL */
export abstract class ProcessControlClass extends ProcessExecutableElementClass {
	protected readonly element: ProcessExecutableElementType = 'control';
	protected type: ProcessControlType;

	constructor(identifier: Identifier, type: ProcessControlType) {
		super(identifier);
		this.type = type;
	}

	public get_control_type(): string {
		return this.type;
	}

	public get_child(): Identifier {
		return this.child_element as Identifier;
	}

	static to_object(control: ProcessControlClass): ProcessControlBaseObject {
		return Object.assign(ProcessExecutableElementClass.to_object(control as ProcessControlClass), { 'element': control.get_element_type(), 'type': control.get_control_type() }) as ProcessControlBaseObject;
	}
}

export class ProcessKeyControlClass extends ProcessControlClass {
	protected reference?: Identifier;

	constructor(identifier: Identifier, reference?: Identifier) {
		super(identifier, 'key');
		this.reference = reference;
	}

	public get_compensating_control(): Maybe<Identifier> {
		return this.reference;
	}

	static from_object(control_as_object: ProcessKeyControlObject): ProcessKeyControlClass {
		let control: ProcessKeyControlClass = new ProcessKeyControlClass(control_as_object['identifier'], control_as_object['reference']);
		control.set_parents(control_as_object['list_of_parents']);
		control.set_child(control_as_object['child']);
		return control;
	}

	static to_object(control: ProcessKeyControlClass): ProcessKeyControlObject {
		const reference: Maybe<Identifier> = control.get_compensating_control();
		return Object.assign(ProcessControlClass.to_object(control as ProcessKeyControlClass), { ...(reference && { 'reference': reference }) }) as ProcessKeyControlObject;
	}
}

export class ProcessCompensatingControlClass extends ProcessControlClass {
	protected reference: Identifier;

	constructor(id: Identifier, reference: Identifier) {
		super(id, 'compensating');
		this.reference = reference;
	}

	public get_key_control(): Identifier {
		return this.reference;
	}

	static from_object(control_as_object: ProcessCompensatingControlObject): ProcessCompensatingControlClass {
		let control: ProcessCompensatingControlClass = new ProcessCompensatingControlClass(control_as_object['identifier'], control_as_object['reference']);
		control.set_parents(control_as_object['list_of_parents']);
		control.set_child(control_as_object['child']);
		return control;
	}

	static to_object(control: ProcessCompensatingControlClass): ProcessCompensatingControlObject {
		return Object.assign(ProcessControlClass.to_object(control as ProcessCompensatingControlClass), { 'reference': control.get_key_control() }) as ProcessCompensatingControlObject;
	}
}

export class ProcessStandardControlClass extends ProcessControlClass {
	constructor(identifier: Identifier) {
		super(identifier, 'standard');
	}

	static from_object(control_as_object: ProcessStandardControlObject): ProcessStandardControlClass {
		let control: ProcessStandardControlClass = new ProcessStandardControlClass(control_as_object['identifier']);
		control.set_parents(control_as_object['list_of_parents']);
		control.set_child(control_as_object['child']);
		return control;
	}

	static to_object(control: ProcessStandardControlClass): ProcessStandardControlObject {
		return ProcessControlClass.to_object(control as ProcessStandardControlClass) as ProcessStandardControlObject;
	}
}


/* PROCESS EVENT */
export class ProcessEventClass extends ProcessElementClass {
	protected readonly element: ProcessElementType = 'event';
	private type: ProcessEventType;
	protected child_element: Nullable<Identifier> = null;

	constructor(id: Identifier, type: ProcessEventType) {
		super(id);
		this.type = type;
	}

	public get_type(): ProcessEventType {
		return this.type;
	}

	public get_child(): Nullable<Identifier> {
		return this.child_element;
	}

	public set_child(child: Nullable<Identifier>): void {
		this.child_element = child;
	}

	static from_object(event_as_object: ProcessEventObject): ProcessEventClass {
		let event: ProcessEventClass = new ProcessEventClass(event_as_object['identifier'], event_as_object['type']);
		event.set_parents(event_as_object['list_of_parents']);
		event.set_child(event_as_object['child'] ?? null);
		return event;
	}

	static to_object(event: ProcessEventClass): ProcessEventObject {
		return Object.assign(ProcessElementClass.to_object(event), { ...(!!event.get_child() && { 'child': event.get_child() as Identifier }), 'type': event.get_type() });
	}
}