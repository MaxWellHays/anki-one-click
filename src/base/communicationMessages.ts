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

export interface ShowBubbleRequest {

}