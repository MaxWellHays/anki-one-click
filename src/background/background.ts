import * as Messages from '../base/communicationMessages';
import { AnkiConnectApi, DeckId } from '../base/ankiConnectApi';
import { YandexDictionaryClient, YandexTranslateResponse } from './yandexDictionaryClient';
import { TriggerKey } from '../base/extensionOptions';
import { type } from 'os';

chrome.runtime.onInstalled.addListener(extensionInstalled);

function extensionInstalled(details: chrome.runtime.InstalledDetails): void {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { schemes: ['http', 'https'] },
            })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
    chrome.contextMenus.create({
        id: "translate",
        title: "Translate",
        contexts: ["selection"]
    });
}

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId == "translate") {
        const request : Messages.Action = {
            type: "ShowBubbleRequest"
        }
        chrome.tabs.sendMessage(tab.id, request);
    }
});

function getSettingsFromStorage(): Promise<{ [key: string]: any }> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(items => resolve(items))
    })
}

function getYandexDictionaryApiKey(): Promise<string> {
    return getSettingsFromStorage().then(settings => settings["yandexDictionaryApiKey"]);
}

function getSelectedDeckName(): Promise<string> {
    return getSettingsFromStorage().then(settings => settings["targetDeck"].name);
}

function setSettingsInStorage(settings: any): Promise<void> {
    return new Promise(resolve => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        })
    })
}

function getWordTranslationsList(yandexResponse: YandexTranslateResponse): Messages.WordTranslation[] {
    const definitions = yandexResponse.def;
    const translations: Messages.WordTranslation[] = [];

    let hasNewDefs = true;
    let i = 0;
    while (hasNewDefs) {
        hasNewDefs = false;
        for (let definition of definitions) {
            if (i < definition.tr.length) {
                hasNewDefs = true;
                translations.push({
                    isInDictionary: false,
                    translation: definition.tr[i].text
                })
            }
        }
        i++;
    }
    return translations;
}

const ankiConnection = new AnkiConnectApi();
const yandexDictionaryApi = new YandexDictionaryClient();

async function getYandexTranslations(word: string): Promise<Messages.WordTranslation[]> {
    const apiKey = await getYandexDictionaryApiKey();
    const translations = await yandexDictionaryApi.translate(apiKey, word);
    return getWordTranslationsList(translations);
}

async function getExistingTranslations(word: string): Promise<string[]> {
    const currentDeck = await getSelectedDeckName();
    const existingTranslations = await ankiConnection.getExistingTranslationOfWord(currentDeck, word);
    return existingTranslations;
}

function generateTranslateResponse(sourceText: string, outsideTranslations: Messages.WordTranslation[], existingTranslations: string[]): Messages.TranslateResponse {
    for (let existingTranslation of existingTranslations) {
        const index = outsideTranslations.findIndex(tr => tr.translation == existingTranslation);
        if (index >= 0) {
            outsideTranslations[index].isInDictionary = true;
        }
        else {
            outsideTranslations.push({
                isInDictionary: true,
                translation: existingTranslation,
            });
        }
    }

    const response: Messages.TranslateResponse = {
        sourceTextToTranslate: sourceText,
        translations: outsideTranslations,
    }

    return response;
}

function sendMessageResponse(action: Messages.Action, source: chrome.runtime.MessageSender): void {
    if (source.tab) {
        chrome.tabs.sendMessage(source.tab.id, action);
    }
    else {
        chrome.runtime.sendMessage(action);
    }
}

async function handleTranslateRequest(message: Messages.TranslateRequest): Promise<Messages.Action> {
    const sourceText = message.sourceTextToTranslate;

    const vals = await Promise.all([getYandexTranslations(sourceText), getExistingTranslations(sourceText)]);

    const outsideTranslations = vals[0];
    const existingTranslations = vals[1];

    const translateResponse = generateTranslateResponse(sourceText, outsideTranslations, existingTranslations);
    return {
        type: "TranslateResponse",
        content: translateResponse
    }
}

async function handleGetExtensionOptionsRequest(): Promise<Messages.Action> {
    const settingsPromise = getSettingsFromStorage();
    const availableDecksPromise = ankiConnection.getAvailableDecks();
    const values = await Promise.all([settingsPromise, availableDecksPromise])
    const settings = values[0] as { [key: string]: any };
    const decks = values[1] as DeckId[];

    const response: Messages.GetExtensionOptionsResponse = {
        extensionOptions: {
            availableDecks: decks,
            yandexDictionaryApiKey: settings["yandexDictionaryApiKey"],
            targetDeck: decks.find(d => d.id == settings["targetDeck"]?.id),
            popupOnDoubleClick: settings["popupOnDoubleClick"] ?? false,
            popupOnSelect: settings["popupOnSelect"] ?? false,
            popupOnDoubleClickTriggerKey: settings["popupOnDoubleClickTriggerKey"] ?? TriggerKey.None,
            popupOnSelectTriggerKey: settings["popupOnSelectTriggerKey"] ?? TriggerKey.None,
        }
    }
    return {
        type: "GetExtensionOptionsResponse",
        content: response
    };
}

async function handleSaveExtensionOptionsRequest(message: Messages.SaveExtensionOptionsRequest): Promise<Messages.Action> {
    await setSettingsInStorage(message.extensionOptionsToSave);
    const response: Messages.SaveExtensionOptionsResponse = {
        optionsSaved: true
    }
    return {
        type: "SaveExtensionOptionsResponse",
        content: response
    };
}

async function handleChangeWordTranslationStateRequest(message: Messages.ChangeWordTranslationStateRequest): Promise<Messages.Action> {
    const currentDeckPromise = getSelectedDeckName();
    const updateTranslations = currentDeckPromise
        .then(deckName => ankiConnection.setTranslationsOfWord(deckName, message.sourceTextToTranslate, message.newTranslations));

    const vals = await Promise.all([updateTranslations, getYandexTranslations(message.sourceTextToTranslate)])

    const response = generateTranslateResponse(message.sourceTextToTranslate, vals[1], vals[0]);
    return {
        type: "TranslateResponse",
        content: response
    };
}

chrome.runtime.onMessage.addListener((wrapper: Messages.Action, sender: chrome.runtime.MessageSender) => {
    let response: Promise<Messages.Action> = null;
    if (Messages.isTranslateRequest(wrapper)) {
        response = handleTranslateRequest(wrapper.content);
    }
    if (Messages.isGetExtensionOptionsRequest(wrapper)) {
        response = handleGetExtensionOptionsRequest();
    }
    if (Messages.isSaveExtensionOptionsRequest(wrapper)) {
        response = handleSaveExtensionOptionsRequest(wrapper.content);
    }
    if (Messages.isChangeWordTranslationStateRequest(wrapper)) {
        response = handleChangeWordTranslationStateRequest(wrapper.content);
    }

    if (response != null) {
        response.then(res => sendMessageResponse(res, sender));
    }
});