import { GetExtensionOptionsResponse, SaveExtensionOptionsResponse } from '../base/communicationMessages';
import { AnkiConnectApi, DeckId } from '../base/ankiConnectApi';

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

function setSettingsInStorage(settings: any) : Promise<void> {
    return new Promise(resolve => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        })
    })
}

var ankiConnection = new AnkiConnectApi();

chrome.runtime.onMessage.addListener((message, sender, responseCallback) => {
    if (message.sourceTextToTranslate) {
        chrome.storage.sync.get("yandexDictionaryApiKey", items => {
            var url = new URL('https://dictionary.yandex.net/api/v1/dicservice.json/lookup');
            const yandexDictionaryApiKey = items["yandexDictionaryApiKey"];
            url.searchParams.set('key', yandexDictionaryApiKey);
            url.searchParams.set('lang', 'en-ru');
            url.searchParams.set('text', message.sourceTextToTranslate);
            var requestOptions = {
                method: 'GET',
                redirect: 'follow'
            } as RequestInit;

            fetch(url.href, requestOptions)
                .then(response => response.json())
                .then(response => {
                    var tabId : number = sender.tab.id;
                    chrome.tabs.sendMessage(tabId, {
                        translation: response,
                        sourceTextToTranslate: message.sourceTextToTranslate
                    })
                });
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