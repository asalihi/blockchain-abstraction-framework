export type ErrorObject = {
	code: (...args: any[]) => string,
	message: (...args: any[]) => string,
	description: (...args: any[]) => string,
	resolution: (...args: any[]) => string
};

export type ServerErrorObject = ErrorObject & { status: (...args: any[]) => number };

export type Errors = {
	API: { [name: string]: ServerErrorObject },
	Controller: { [name: string]: ErrorObject },
	Cryptography: { [name: string]: ErrorObject },
	Database: { [name: string]: ErrorObject },
	RabbitMQ: { [name: string]: ErrorObject },
	Server: { [name: string]: ServerErrorObject },
	Utility: { [name: string]: ErrorObject }
};