import { AxiosResponse } from 'axios';

import { HTTP_REQUEST_SUPPORTED_METHOD_VALUES } from '@service/utils/constants';

export enum HTTPMethod {
    GET = 'get',
    POST = 'post',
    DELETE = 'delete'
};

export type HTTPRequestSupportedMethods = typeof HTTP_REQUEST_SUPPORTED_METHOD_VALUES[number];

export type HTTPEndpoint = string;
export type HTTPHeaders = { [key: string]: any };
export type HTTPParameters = { [key: string]: any };
export type HTTPResponse = AxiosResponse;

export enum Endpoint { WEB = 'web', API = 'api' };

export type Credentials = { username: string, password: string };