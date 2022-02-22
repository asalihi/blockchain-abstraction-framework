import { Custodian } from 'core';

export const DEFAULT_CUSTODIANS: Omit<Custodian, 'registration'>[] = [
    {
        'identifier': 'mongodb-storage',
        'type': 'internal',
        'server': {
            'openapi': '3.0.3',
            'info': {
                'title': 'MongoDB storage',
                'description': 'This server is used to store data in a dedicated MongoDB database. It follows the specifications related to custodians, as enforced by the platform.',
                'version': '1.0'
            },
            'servers': [
                { 'url': 'http://localhost:3003', 'description': 'Development server' }
            ],
            'paths': {
                '/repositories': {
                    'summary': 'Represents the list of created repositories',
                    'get': {
                        'description': 'Retrieves repositories based on several filters',
                        "parameters": [
                            {
                                '$ref': '#/components/parameters/page'
                            },
                            {
                                '$ref': '#/components/parameters/size'
                            },
                            {
                                '$ref': '#/components/parameters/identifier'
                            },
                            {
                                '$ref': '#/components/parameters/sort_direction'
                            },
                            {
                                'in': 'query',
                                'name': 'sort_field',
                                'schema': { 'type': 'string', 'enum': ['identifier', 'name', 'description', 'custodian', 'state', 'creation'] },
                                'required': false,
                                'description': 'The field to be used to sort the entries to be fetched'
                            },
                            {
                                'in': 'query',
                                'name': 'name',
                                'schema': { 'type': 'string' },
                                'required': false,
                                'description': 'A regular expression used to describe partially or fully the name of the entries to fetch'
                            },
                            {
                                'in': 'query',
                                'name': 'description',
                                'schema': { 'type': 'string' },
                                'required': false,
                                'description': 'A regular expression used to describe partially or fully the description of the entries to fetch'
                            },
                            {
                                'in': 'query',
                                'name': 'custodian',
                                'schema': { 'type': 'string' },
                                'required': false,
                                'description': 'A regular expression used to describe partially or fully the identifier of the custodian associated to the entries to fetch'
                            },
                            {
                                'in': 'query',
                                'name': 'state',
                                'schema': { 'type': 'string', 'enum': ['active', 'deactivated'] },
                                'required': false,
                                'description': 'The state of the repositories to fetch'
                            },
                            {
                                'in': 'query',
                                'name': 'before',
                                'schema': { 'type': 'string' },
                                'required': false,
                                'description': 'Date representing the limit before each all fetched entries should have been created'
                            },
                            {
                                'in': 'query',
                                'name': 'after',
                                'schema': { 'type': 'number' },
                                'required': false,
                                'description': 'Date representing the limit after each all fetched entries should have been created'
                            }
                        ],
                        'responses': {
                            '200': {
                                'description': 'Object containing fetched repositories and information related to the pagination system',
                                'content': {
                                    'application/json': {
                                        'schema': {
                                            'type': 'object',
                                            'properties': {
                                                'items': {
                                                    'type': 'integer',
                                                    'description': 'The number of repositories matching selection criteria'
                                                },
                                                'pages': {
                                                    'type': 'integer',
                                                    'description': 'The number of pages to be returned in total as part of the pagination system for the defined `size`'
                                                },
                                                'current': {
                                                    'type': 'integer',
                                                    'description': 'The current page to be returned'
                                                },
                                                'size': {
                                                    'type': 'integer',
                                                    'description': 'The number of repositories returned as part of current page'
                                                },
                                                'repositories': {
                                                    'type': 'array',
                                                    'items': {
                                                        '$ref': '#/components/schemas/repository'
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    'post': {
                        'description': 'Creates a new repository',
                        'requestBody': {
                            'description': 'The repository to create',
                            'content': {
                                'âpplication/json': {
                                    'schema': {
                                        'type': 'object',
                                        'properties': {
                                            'identifier': {
                                                'type': 'string',
                                                'description': 'The identifier of the repository to create. If no identifier is set, one is generated automatically during the creation.'
                                            },
                                            'name': {
                                                'type': 'string',
                                                'description': 'The name of the repository'
                                            },
                                            'description': {
                                                'type': 'string',
                                                'description': 'The description of the repository'
                                            },
                                            'custodian': {
                                                'type': 'string',
                                                'description': 'The identifier of the custodian responsible of this repository'
                                            }
                                        },
                                        'required': ['name', 'custodian']
                                    },
                                    'example': {
                                        'identifier': 'default-repository',
                                        'name': 'Default repository',
                                        'description': 'This repository should be used to store data which is not related to specific context',
                                        'custodian': 'mongodb-storage'
                                    }
                                }
                            }
                        },
                        'responses': {
                            '200': {
                                'description': 'Object representing the identifier of the created repository',
                                'content': {
                                    'application/json': {
                                        'schema': {
                                            'type': 'object',
                                            'properties': {
                                                'identifier': {
                                                    'type': 'string'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                '/repositories/{identifier}': {
                    'summary': 'Represents a repository stored within the platform',
                    'get': {
                        'description': 'Retrieves a repository using its `identifier`',
                        'parameters': [
                            {
                                'name': 'identifier',
                                'in': 'path',
                                'description': 'The identifier of the repository to fetch',
                                'required': true,
                                'schema': {
                                    'type': 'string'
                                }
                            }
                        ],
                        'responses': {
                            '200': {
                                'description': 'Object representing the retrieved repository',
                                'content': {
                                    'application/json': {
                                        'schema': {
                                            '$ref': '#/components/schemas/repository'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                '/repositories/{repository}/entries': {
                    'summary': 'Route dedicated to the references of a given repository',
                    'get': {
                        'description': 'Retrieves the list of the references stored within a given repository',
                        'parameters': [
                            {
                                'name': 'repository',
                                'in': 'path',
                                'description': 'The identifier of the repository for which references should be fetched',
                                'required': true,
                                'schema': {
                                    'type': 'string'
                                }
                            },
                            {
                                '$ref': '#/components/parameters/page'
                            },
                            {
                                '$ref': '#/components/parameters/size'
                            }
                        ],
                        'responses': {
                            '200': {
                                'description': 'Object containing fetched references and information related to the pagination system',
                                'content': {
                                    'application/json': {
                                        'schema': {
                                            'type': 'object',
                                            'properties': {
                                                'items': {
                                                    'type': 'integer',
                                                    'description': 'The number of references fetched'
                                                },
                                                'pages': {
                                                    'type': 'integer',
                                                    'description': 'The number of pages to be returned in total as part of the pagination system for the defined `size`'
                                                },
                                                'current': {
                                                    'type': 'integer',
                                                    'description': 'The current page to be returned'
                                                },
                                                'size': {
                                                    'type': 'integer',
                                                    'description': 'The number of references returned as part of current page'
                                                },
                                                'references': {
                                                    'type': 'array',
                                                    'items': {
                                                        '$ref': '#/components/schemas/reference'
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    'post': {
                        'description': 'Creates a new reference',
                        'parameters': [
                            {
                                'name': 'repository',
                                'in': 'path',
                                'description': 'The identifier of the repository for which references should be fetched',
                                'required': true,
                                'schema': {
                                    'type': 'string'
                                }
                            }
                        ],
                        'requestBody': {
                            'description': 'The reference to create',
                            'content': {
                                'âpplication/json': {
                                    'schema': {
                                        'type': 'object',
                                        'properties': {
                                            'identifier': {
                                                'type': 'string',
                                                'description': 'The identifier of the reference to create. If no identifier is set, one is generated automatically during the creation.'
                                            },
                                            'data': {
                                                'description': 'The data to store within the custodian associated to the repository'
                                            }
                                        },
                                        'required': ['data']
                                    },
                                    'example': {
                                        'identifier': 'reference1',
                                        'data': { 'key1': 'value1', 'key2': 'value2' }
                                    }
                                }
                            }
                        },
                        'responses': {
                            '200': {
                                'description': 'Object representing the identifier of the created reference',
                                'content': {
                                    'application/json': {
                                        'schema': {
                                            'type': 'object',
                                            'properties': {
                                                'identifier': {
                                                    'type': 'string'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                '/repositories/{repository}/entries/{entry}': {
                    'summary': 'Route dedicated to a reference stored within a given repository',
                    'get': {
                        'description': 'Retrieves the reference stored within a given repository',
                        'parameters': [
                            {
                                'name': 'repository',
                                'in': 'path',
                                'description': 'The identifier of the repository for which references should be fetched',
                                'required': true,
                                'schema': {
                                    'type': 'string'
                                }
                            },
                            {
                                'name': 'entry',
                                'in': 'path',
                                'description': 'The identifier of the reference to fetch',
                                'required': true,
                                'schema': {
                                    'type': 'string'
                                }
                            }
                        ],
                        'responses': {
                            '200': {
                                'description': 'Object containing fetched reference',
                                'content': {
                                    'application/json': {
                                        'schema': {
                                            '$ref': '#/components/schemas/reference'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            'components': {
                'schemas': {
                    'repository': {
                        'type': 'object',
                        'properties': {
                            'identifier': {
                                'type': 'string',
                                'description': 'The unique identifier of the repository'
                            },
                            'name': {
                                'type': 'string',
                                'description': 'The name of the repository'
                            },
                            'description': {
                                'type': 'string',
                                'description': 'A description of the repository'
                            },
                            'creation': {
                                'type': 'integer',
                                'description': 'The timestamp representing the date when the repository was created'
                            },
                            'custodian': {
                                'type': 'string',
                                'description': 'The identifier of the custodian storing the data entries related to this repository'
                            },
                            'state': {
                                'type': 'string',
                                'enum': ['active', 'deactivated'],
                                'description': 'The state of the repository'
                            },
                            'entries': {
                                'type': 'array',
                                'items': {
                                    'type': 'string',
                                    'description': 'The identifier of the reference related to the data entry stored on custodian'
                                }
                            }
                        },
                        'required': ['identifier', 'name', 'creation', 'custodian', 'state', 'entries']
                    },
                    'reference': {
                        'type': 'object',
                        'properties': {
                            'identifier': {
                                'type': 'string',
                                'description': 'The unique identifier of the reference stored internally'
                            },
                            'creation': {
                                'type': 'integer',
                                'description': 'Timestamp representing the creation date of the reference'
                            },
                            'repository': {
                                'type': 'string',
                                'description': 'The unique identifier of the repository responsible of this reference'
                            },
                            'data': {
                                'type': 'string',
                                'description': 'The unique identifier of the data entry stored within the custodian associated to the repository of the reference'
                            },
                            'fingerprint': {
                                'type': 'string',
                                'pattern': '^[A-Fa-f0-9]{64}$',
                                'description': 'The SHA256 of the data entry stored within the custodian'
                            },
                            'record': {
                                'type': 'string',
                                'description': 'The unique identifier of the record stored within the platform and representing the transaction submitted in the context of this reference'
                            }
                        },
                        'required': ['identifier', 'creation', 'repository', 'data', 'fingerprint']
                    }
                },
                'parameters': {
                    'page': {
                        'in': 'query',
                        'name': 'page',
                        'schema': { 'type': 'integer', 'minimum': 1, 'default': 1 },
                        'required': false,
                        'description': 'The current page of entries to return as part of the pagination system'
                    },
                    'size': {
                        'in': 'query',
                        'name': 'size',
                        'schema': { 'type': 'integer', 'minimum': 1, 'default': 10 },
                        'required': false,
                        'description': 'The size of the page to return as part of the pagination system'
                    },
                    'sort_direction': {
                        'in': 'query',
                        'name': 'sort_direction',
                        'schema': { 'type': 'string', 'enum': ['asc', 'desc'] },
                        'required': false,
                        'description': 'The field to be used to sort the entries to be fetched'
                    },
                    'identifier': {
                        'in': 'query',
                        'name': 'identifier',
                        'schema': { 'type': 'string' },
                        'required': false,
                        'description': 'A regular expression used to describe partially or fully the identifier of the entries to fetch'
                    }
                }
            }
        }
    }
];