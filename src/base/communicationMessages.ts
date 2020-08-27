import { ExtensionOptions } from "./extensionOptions";
import { getMessage } from '@extend-chrome/messages'

export interface TranslateRequest {
    sourceTextToTranslate: string;
}

export interface TranslateResponse {
    sourceTextToTranslate: string;
    translations: WordTranslation[];
}

export interface ChangeWordTranslationStateRequest {
    sourceTextToTranslate: string;
    newTranslations: string[];
}

export interface WordTranslation {
    isInDictionary: boolean;
    translation: string;
}

export const [sendExtensionOptionsRequest, extensionOptionsRequestStream, waitForExtensionOptionsRequest] = getMessage("GetExtensionOptionsRequest");
export const [sendExtensionOptionsResponse, extensionOptionsResponseStream, waitForExtensionOptionsResponse] = getMessage<ExtensionOptions>("GetExtensionOptionsResponse");

export const [sendSaveExtensionOptionsRequest, saveExtensionOptionsRequestStream, waitForSaveExtensionRequestOptions] = getMessage<ExtensionOptions>("SaveExtensionOptionsRequst");
export const [sendSaveExtensionOptionsResponse, saveExtensionOptionsResponseStream, waitForSaveExtensionResponseOptions] = getMessage<boolean>("SaveExtensionOptionsResponse");

export const [sendTranslateRequest, translateRequestStream, waitForTranslateRequest] = getMessage<TranslateRequest>("TranslateRequest");
export const [sendTranslateResponse, translateResponseStream, waitForTranslateResponse] = getMessage<TranslateResponse>("TranslateResponse");

export const [sendChangeTranslationStateRequest, changeTranslationStateRequestStream, waitForChangeTranslationStateRequest] = getMessage<ChangeWordTranslationStateRequest>("ChangeTranslationStateRequest");

export const [sendShowBubbleRequest, showBubbleRequestStream, waitForShowBubbleRequest] = getMessage("ShowBubble");