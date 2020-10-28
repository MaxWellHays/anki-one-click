import * as Messages from '../base/communicationMessages';
import { AnkiConnectApi, DeckId } from '../base/ankiConnectApi';
import { YandexDictionaryClient, YandexTranslateResponse } from './yandexDictionaryClient';
import { TriggerKey, ExtensionOptions } from '../base/extensionOptions';
import { Observable, defer } from 'rxjs';
import { map } from 'rxjs/operators';
import 'rxjs/add/observable/fromPromise';

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
        Messages.sendShowBubbleRequest("", { tabId: tab.id });
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

Messages.translateRequestStream.subscribe(([request, sender]) => handleTranslateRequest(request, sender))

async function handleTranslateRequest(request: Messages.TranslateRequest, sender: chrome.runtime.MessageSender): Promise<void> {
    const contextText = request.contextSentence;
    const selectionText = contextText.substr(request.selectionStart, request.selectionLength);

    const vals = await Promise.all([getYandexTranslations(selectionText), getExistingTranslations(selectionText)]);

    const outsideTranslations = vals[0];
    const existingTranslations = vals[1];

    const translateResponse = generateTranslateResponse(selectionText, outsideTranslations, existingTranslations);

    await Messages.sendTranslateResponse(translateResponse, { tabId: sender.tab?.id });
};

Messages.extensionOptionsRequestStream.subscribe(([request, sender]) => handleGetExtensionOptionsRequest(sender));

async function handleGetExtensionOptionsRequest(sender: chrome.runtime.MessageSender): Promise<void> {
    const settingsPromise = getSettingsFromStorage();
    const availableDecksPromise = ankiConnection.getAvailableDecks();
    const values = await Promise.all([settingsPromise, availableDecksPromise])
    const settings = values[0] as { [key: string]: any };
    const decks = values[1] as DeckId[];

    const response: ExtensionOptions = {
        availableDecks: decks,
        yandexDictionaryApiKey: settings["yandexDictionaryApiKey"],
        targetDeck: decks.find(d => d.id == settings["targetDeck"]?.id),
        popupOnDoubleClick: settings["popupOnDoubleClick"] ?? false,
        popupOnSelect: settings["popupOnSelect"] ?? false,
        popupOnDoubleClickTriggerKey: settings["popupOnDoubleClickTriggerKey"] ?? TriggerKey.None,
        popupOnSelectTriggerKey: settings["popupOnSelectTriggerKey"] ?? TriggerKey.None,
    }
    Messages.sendExtensionOptionsResponse(response, { tabId: sender.tab?.id });
}

Messages.saveExtensionOptionsRequestStream.subscribe(([request, sender]) => handleSaveExtensionOptionsRequest(request, sender));

async function handleSaveExtensionOptionsRequest(request: ExtensionOptions, sender: chrome.runtime.MessageSender): Promise<void> {
    await setSettingsInStorage(request);
    Messages.sendSaveExtensionOptionsResponse(true, { tabId: sender.tab?.id });
}

Messages.changeTranslationStateRequestStream.subscribe(([request, sender]) => handleChangeWordTranslationStateRequest(request, sender));

async function handleChangeWordTranslationStateRequest(message: Messages.ChangeWordTranslationStateRequest, sender: chrome.runtime.MessageSender): Promise<void> {
    const currentDeckPromise = getSelectedDeckName();
    const updateTranslations = currentDeckPromise
        .then(deckName => ankiConnection.setTranslationsOfWord(deckName, message.sourceTextToTranslate, message.newTranslations));

    const vals = await Promise.all([updateTranslations, getYandexTranslations(message.sourceTextToTranslate)])

    const response = generateTranslateResponse(message.sourceTextToTranslate, vals[1], vals[0]);
    Messages.sendTranslateResponse(response, { tabId: sender.tab?.id });
}