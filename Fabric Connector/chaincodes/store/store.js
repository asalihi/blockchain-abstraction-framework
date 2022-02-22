const shim = require('fabric-shim');

const key_value_regex = new RegExp(/^[\:\-a-zA-Z0-9]*$/);

var Store = class {
  async Init(stub) {
    console.info('========= Initialization of store =========');
    const request = stub.getFunctionAndParameters();
    console.info(request);

    return shim.success();
  }

  async Invoke(stub) {
    const request = stub.getFunctionAndParameters();
    console.info('========= Invocation of store =========');
    console.info(request);

    try {
      switch(request.fcn) {
        case 'register': {
          const response = await this.register(stub, request.params);
          return shim.success(Buffer.from(response));
        }
        case 'retrieve': {
          const response = await this.retrieve(stub, request.params);
          return shim.success(Buffer.from(JSON.stringify(response)));
        }
        default: {
          console.error(`Function does not exist: ${ request.fcn }`);
          return shim.error(Buffer.from(`Function does not exist: ${ request.fcn }`));
        }
      }
    } catch(error) {
      console.error('An unexpected error occurred');
      console.error(error);
      return shim.error(error);
    }
  }

  async register(stub, args) {
    if(args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2 arguments (key: string, value: string).');
    }

    const value = args.pop();
    const key = args.pop();

    if(!key || !value || !key_value_regex.test(key) || !key_value_regex.test(value)) {
      throw new Error('Key and value should not be empty and should be valid strings (as per framework requirements)');
    }

    stub.setEvent('RegisterEntry', Buffer.from(JSON.stringify({ key, value })));
    await stub.putState(key, Buffer.from(value));
    return `Entry saved successfully in store (key: ${key} | value: ${value})`;
  }

  async retrieve(stub, args) {
    if(args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1 arguments (key: string).');
    }

    const key = args.pop();

    if(!key || !key_value_regex.test(key)) {
      throw new Error('Key should not be empty and should be valid string (as per framework requirements)');
    }

    const value_as_bytes = await stub.getState(key);

    if(value_as_bytes.length === 0) {
      stub.setEvent('RetrieveInvalidEntry', Buffer.from(key));
      throw new Error(`Could not retrieve value for given key: ${key}`);
    } else {
      const value = value_as_bytes.toString();
      console.info(`Key: ${key} | Value: ${value}\n`);
      stub.setEvent('RetrieveEntry', Buffer.from(JSON.stringify({ key, value })));
      return { key, value };
    }
  }
};

shim.start(new Store());