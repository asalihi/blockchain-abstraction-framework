export type ErrorObject = {
	code: (...args: any[]) => string,
	message: (...args: any[]) => string,
	description: (...args: any[]) => string,
	resolution: (...args: any[]) => string
};

export type StaticErrorObject = {
	code: string,
	message: string,
	description: string,
	resolution: string
}

export type ServerErrorObject = ErrorObject & { status: (...args: any[]) => number };

export type StaticServerErrorObject = StaticErrorObject & { status: number };

export type Errors = {
	Utility: { [name: string]: ErrorObject },
	Server: { [name: string]: ServerErrorObject },
	API: { [name: string]: ServerErrorObject },
	Cryptography: { [name: string]: ErrorObject },
	Database: { [name: string]: ErrorObject }
};