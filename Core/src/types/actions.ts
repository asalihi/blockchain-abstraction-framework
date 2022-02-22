import { ACTION_TYPE_VALUES, SUPPORTED_TASK_ACTIONS } from '@core/constants/constants';
import { Identifier, Message, HTTPMethod, HTTPHeaders, HTTPParameters, NotificationAudience } from '@core/types/types';

export type ActionType = typeof ACTION_TYPE_VALUES[number];
export type SupportedTaskAction = typeof SUPPORTED_TASK_ACTIONS[number];

export type ActionBase = {
    'identifier'?: Identifier,
    'type': ActionType
};

export type ManageTaskAction = ActionBase & {
    'task': Identifier,
    'action': SupportedTaskAction
};

export type SendEmailAction = ActionBase & {
    'receivers': string[],
    'subject': string,
    'content': string
};

export type SendHTTPRequestAction = ActionBase & {
    'endpoint': Identifier,
    'method': HTTPMethod,
    'headers'?: HTTPHeaders,
    'parameters'?: HTTPParameters
};

export type SendNotificationActionOptions = Partial<{ 'context': boolean }>;

export type SendNotificationAction = ActionBase & {
    'audience': NotificationAudience,
    'message': Message,
    'options'?: SendNotificationActionOptions
}

export type Action = ManageTaskAction | SendEmailAction | SendHTTPRequestAction | SendNotificationAction;