import { ExtensionOptions } from "./extensionOptions";

export interface GetExtensionOptionsRequest {
    optionsRequest : string;
}

export interface GetExtensionOptionsResponse {
    extensionOptions : ExtensionOptions;
}

export interface SaveExtensionOptionsRequest {
    extensionOptionsToSave : ExtensionOptions;
}

export interface SaveExtensionOptionsResponse {
    optionsSaved : boolean;
}

export interface TranslateRequest {

}

export interface ShowBubbleRequest {

}