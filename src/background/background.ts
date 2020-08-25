import { GetExtensionOptionsResponse, SaveExtensionOptionsResponse, TranslateResponse, WordTranslation, ChangeWordTranslationStateRequest } from '../base/communicationMessages';
import { AnkiConnectApi, DeckId } from '../base/ankiConnectApi';
import { YandexDictionaryClient, YandexTranslateResponse } from './yandexDictionaryClient';
import { TriggerKey } from '../base/extensionOptions';

chrome.runtime.onInstalled.addListener(extensionInstalled);

function extensionInstalled(details: chrome.runtime.InstalledDetails) : void {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { schemes: ['http', 'https']},
            })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
}

chrome.contextMenus.create({
    id: "translate",
    title: "Translate",
    contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId == "translate") {
        chrome.tabs.sendMessage(tab.id, { operation: "showBubble", text: info.selectionText });
        console.log("show bubble sent");
    }
});

function getSettingsFromStorage() : Promise<{ [key: string]: any }> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(items => resolve(items))
    })
}

function getYandexDictionaryApiKey() : Promise<string> {
    return getSettingsFromStorage().then(settings => settings["yandexDictionaryApiKey"]);
}

function getSelectedDeckName() : Promise<string> {
    return getSettingsFromStorage().then(settings => settings["targetDeck"].name);
}

function setSettingsInStorage(settings: any) : Promise<void> {
    return new Promise(resolve => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        })
    })
}

function getWordTranslationsList(yandexResponse: YandexTranslateResponse) : WordTranslation[] {
    const definitions = yandexResponse.def;
    const translations : WordTranslation[] = [];

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

async function getYandexTranslations(word: string) : Promise<WordTranslation[]> {
    const apiKey = await getYandexDictionaryApiKey();
    const translations = await yandexDictionaryApi.translate(apiKey, word);
    return getWordTranslationsList(translations);
}

async function getExistingTranslations(word: string) : Promise<string[]> {
    const currentDeck = await getSelectedDeckName();
    const existingTranslations = await ankiConnection.getExistingTranslationOfWord(currentDeck, word);
    return existingTranslations;
}

function generateTranslateResponse(sourceText : string,outsideTranslations : WordTranslation[], existingTranslations: string[]) : TranslateResponse {
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

    const response : TranslateResponse = {
        sourceTextToTranslate: sourceText,
        translations: outsideTranslations,
    }

    return response;
}

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.sourceTextToTranslate && Object.keys(message).length == 1) {
        const sourceText = message.sourceTextToTranslate;
        Promise.all([getYandexTranslations(sourceText), getExistingTranslations(sourceText)]).then(vals => {
            const outsideTranslations = vals[0];
            const existingTranslations = vals[1];

            const response = generateTranslateResponse(sourceText, outsideTranslations, existingTranslations);
            if (sender.tab) {
                chrome.tabs.sendMessage(sender.tab.id, response);
            }
            else {
                chrome.runtime.sendMessage(response);
            }
        });
    }
    if (message.optionsRequest) {
        const settingsPromise = getSettingsFromStorage();
        const availableDecksPromise = ankiConnection.getAvailableDecks();
        Promise.all([settingsPromise, availableDecksPromise]).then(values => {
            const settings = values[0] as { [key: string]: any };
            const decks = values[1] as DeckId[];

            const response : GetExtensionOptionsResponse = {
                extensionOptions : {
                    availableDecks: decks,
                    yandexDictionaryApiKey: settings["yandexDictionaryApiKey"],
                    targetDeck: decks.find(d => d.id == settings["targetDeck"]?.id),
                    popupOnDoubleClick: settings["popupOnDoubleClick"] ?? false,
                    popupOnSelect: settings["popupOnSelect"] ?? false,
                    popupOnDoubleClickTriggerKey: settings["popupOnDoubleClickTriggerKey"] ?? TriggerKey.None,
                    popupOnSelectTriggerKey: settings["popupOnSelectTriggerKey"] ?? TriggerKey.None,
                }
            }
            if (sender.tab) {
                chrome.tabs.sendMessage(sender.tab.id, response);
            }
            else {
                chrome.runtime.sendMessage(response);
            }
        })
    }
    if (message.extensionOptionsToSave) {
        setSettingsInStorage(message.extensionOptionsToSave).then(() => {
            const response : SaveExtensionOptionsResponse = {
                optionsSaved: true
            }
            chrome.runtime.sendMessage(response);
        });
    }
    if (message.newTranslations) {
        const request = message as ChangeWordTranslationStateRequest;
        const currentDeckPromise = getSelectedDeckName();
        const updateTranslations = currentDeckPromise
            .then(deckName => ankiConnection.setTranslationsOfWord(deckName, request.sourceTextToTranslate, request.newTranslations));

        Promise.all([updateTranslations, getYandexTranslations(request.sourceTextToTranslate)])
            .then(vals => {
                const response = generateTranslateResponse(request.sourceTextToTranslate, vals[1], vals[0]);
                if (sender.tab) {
                    chrome.tabs.sendMessage(sender.tab.id, response);
                }
                else {
                    chrome.runtime.sendMessage(response);
                }
            });
    }
});