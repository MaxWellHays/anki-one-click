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
}