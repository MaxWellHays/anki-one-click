import { ExtensionOptions } from "./extensionOptions";

export interface GetExtensionOptionsResponse {
    extensionOptions: ExtensionOptions;
}

export interface SaveExtensionOptionsRequest {
    extensionOptionsToSave: ExtensionOptions;
}

export interface SaveExtensionOptionsResponse {
    optionsSaved: boolean;
}

export interface TranslateRequest {
    sourceTextToTranslate: string;
}

export interface WordTranslation {
    isInDictionary: boolean;
    translation: string;
}

export interface ChangeWordTranslationStateRequest {
    sourceTextToTranslate: string;
    newTranslations: string[];
}

export interface TranslateResponse {
    sourceTextToTranslate: string;
    translations: WordTranslation[];
}

export type Action = {
    type: "GetExtensionOptionsRequest"
} | {
    type: "GetExtensionOptionsResponse",
    content: GetExtensionOptionsResponse
} | {
    type: "SaveExtensionOptionsRequest",
    content: SaveExtensionOptionsRequest
} | {
    type: "SaveExtensionOptionsResponse",
    content: SaveExtensionOptionsResponse
} | {
    type: "TranslateRequest",
    content: TranslateRequest
} | {
    type: "ChangeWordTranslationStateRequest",
    content: ChangeWordTranslationStateRequest
} | {
    type: "TranslateResponse",
    content: TranslateResponse
} | {
    type: "ShowBubbleRequest"
};

export function isGetExtensionOptionsRequest(message: Action): message is {type: "GetExtensionOptionsRequest"} {
    return message.type === "GetExtensionOptionsRequest";
}

export function isGetExtensionOptionsResponse(message: Action): message is {type: "GetExtensionOptionsResponse", content: GetExtensionOptionsResponse} {
    return message.type === "GetExtensionOptionsResponse";
}

export function isSaveExtensionOptionsRequest(message: Action): message is {type: "SaveExtensionOptionsRequest", content: SaveExtensionOptionsRequest} {
    return message.type === "SaveExtensionOptionsRequest";
}

export function isSaveExtensionOptionsResponse(message: Action): message is {type: "SaveExtensionOptionsResponse", content: SaveExtensionOptionsResponse} {
    return message.type === "SaveExtensionOptionsResponse";
}

export function isTranslateRequest(message: Action): message is {type: "TranslateRequest", content: TranslateRequest} {
    return message.type === "TranslateRequest";
}

export function isChangeWordTranslationStateRequest(message: Action): message is {type: "ChangeWordTranslationStateRequest", content: ChangeWordTranslationStateRequest} {
    return message.type === "ChangeWordTranslationStateRequest";
}

export function isTranslateResponse(message: Action): message is {type: "TranslateResponse", content: TranslateResponse} {
    return message.type === "TranslateResponse";
}

export function isShowBubbleRequest(message: Action): message is {type: "ShowBubbleRequest"} {
    return message.type === "ShowBubbleRequest";
}