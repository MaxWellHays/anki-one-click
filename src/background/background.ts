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

chrome.runtime.onMessage.addListener(message => {
    if (message.sourceTextToTranslate) {
        chrome.storage.sync.get("yandexTranslateApiKey", items => {
            var url = new URL('https://translate.yandex.net/api/v1.5/tr.json/translate');
            const yandexTranslateApiKey = items["yandexTranslateApiKey"];
            url.searchParams.set('key', yandexTranslateApiKey);
            url.searchParams.set('lang', 'en-ru');
            url.searchParams.set('format', 'plain');
            url.searchParams.set('text', this.props.sourceText);
            var requestOptions = {
                method: 'GET',
                redirect: 'follow'
            } as RequestInit;

            fetch(url.href, requestOptions)
                .then(response => response.json())
                .then(response => {
                    this.setState({
                        translation: response.text
                    });
                });
        });
    }
});