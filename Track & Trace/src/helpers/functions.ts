import { KEY_REFERENCE_TEMPLATE_REGEX } from '@service/constants/constants';

export function FormatValueUsingExternalReference(value: string, data: Record<'process' | 'version' | 'instance' | 'task', { [key: string]: any }>): string {
    const changes: { [key: string]: string } = {};
    check:
    for (const match of value.matchAll(KEY_REFERENCE_TEMPLATE_REGEX)) {
        const context: string = match.groups!.context;
        const key: string = match.groups!.key;

        if (changes[`\$REFERENCE:${context}:${key}\$`]) continue check;

        if (data[context.toLowerCase() as 'process' | 'version' | 'instance' | 'task'][key]) {
            changes[`\$REFERENCE:${context}:${key}\$`] = data[context.toLowerCase() as 'process' | 'version' | 'instance' | 'task'][key];
            continue check;
        }

        throw new Error(`[TRACK-AND-TRACE:HELPER] Reference ${key} could not be found in ${context.toLowerCase()} resources. Aborting.`);
    }

    for (const [reference, change] of Object.entries(changes)) {
        value = value.replaceAll(reference, change);
    }

    return value;
}