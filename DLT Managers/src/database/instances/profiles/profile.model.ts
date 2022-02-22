import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { ARCHITECTURE_TYPES, GOVERNANCE_TYPES, IMMUTABILITY_TYPES, SCALABILITY_LEVELS } from 'core';
import { IDLTInstanceProfileSchema } from './profile.interface';

export const DLT_INSTANCE_PROFILE_COLLECTION_NAME: string = 'dlt-instance-profile';

export const DLTInstanceProfileSchema: MongooseSchema = new MongooseSchema({
	'instance': {
      type: String,
      unique: true,
      required: true
    },
    'consensus': {
    	'type': {
            type: String,
            enum: ARCHITECTURE_TYPES
    	},
    	'algorithms': [String]
    },
    'contract': {
    	'support': {
    		type: Boolean
    	},
    	'completeness': {
    		type: Boolean
    	},
    	'languages': [String]
    },
    'currency': {
    	type: Boolean
    },
    'decentralization': {
    	type: Number
    },
    'energy-saving': {
    	type: Boolean
    },
    'fees': {
    	type: Number
    },
    'finality': {
    	type: Number
    },
    'governance': {
    	'open-source': {
    		type: Boolean
    	},
    	'type': {
            type: String,
            enum: GOVERNANCE_TYPES
    	}
    },
    'immutability': {
        type: String,
        enum: IMMUTABILITY_TYPES
    },
    'lightnode': {
    	type: Boolean
    },
    'maturity': {
    	type: Number
    },
    'platform': {
        type: String,
        enum: ARCHITECTURE_TYPES
    },
    'privacy': {
    	'participants': {
    		type: Boolean
    	},
    	'transactions': {
    		type: Boolean
    	}
    },
    'scalability': {
        type: String,
        enum: SCALABILITY_LEVELS
    },
    'security': {
    	'quantum-resistant': {
    		type: Boolean
    	},
    	'fault-tolerance': {
    		type: Number,
    		min: 0,
    		max: 100
    	}
    },
    'storage': {
    	type: Boolean
    },
    'tokenization': {
    	type: Boolean
    },
    'throughput': {
        type: Number
    }
}, { collection: DLT_INSTANCE_PROFILE_COLLECTION_NAME });

export interface IDLTInstanceProfileModel extends Document, IDLTInstanceProfileSchema {};