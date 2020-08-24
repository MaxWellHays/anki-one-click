import { GetExtensionOptionsResponse, SaveExtensionOptionsResponse, TranslateResponse, WordTranslation } from '../base/communicationMessages';
import { AnkiConnectApi, DeckId } from '../base/ankiConnectApi';
import { YandexDictionaryClient, YandexTranslateResponse } from './yandexDictionaryClient';

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

var ankiConnection = new AnkiConnectApi();
var yandexDictionaryApi = new YandexDictionaryClient();

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.sourceTextToTranslate) {
        var sourceToTranslate = message.sourceTextToTranslate;
        var apiKeyPromise = getYandexDictionaryApiKey();
        var translationsPromise = apiKeyPromise.then(apiKey => yandexDictionaryApi.translate(apiKey, sourceToTranslate));
        var currentDeckPromise = getSelectedDeckName();
        var existingTranslationsPromise = currentDeckPromise.then(deckName => ankiConnection.getExistingTranslationOfWord(deckName, sourceToTranslate))
        Promise.all([translationsPromise, existingTranslationsPromise]).then(vals => {
            const outsideTranslations = getWordTranslationsList(vals[0]);
            const existingTranslations = vals[1];

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
                sourceTextToTranslate: sourceToTranslate,
                translations: outsideTranslations,
            }
            chrome.tabs.sendMessage(sender.tab.id, response);
        });
    }
    if (message.optionsRequest) {
        var settingsPromise = getSettingsFromStorage();
        var availableDecksPromise = ankiConnection.getAvailableDecks();
        Promise.all([settingsPromise, availableDecksPromise]).then(values => {
            const settings = values[0] as { [key: string]: any };
            const decks = values[1] as DeckId[];

            var response : GetExtensionOptionsResponse = {
                extensionOptions : {
                    availableDecks: decks,
                    yandexDictionaryApiKey: settings["yandexDictionaryApiKey"],
                    targetDeck: decks.find(d => d.id == settings["targetDeck"]?.id)
                }
            }
            chrome.runtime.sendMessage(response);
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
});