chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set({ color: '#3aa757' }, function () {
        console.log("The color is green.");
    });
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { schemes: ['http', 'https']},
            })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);

        chrome.contextMenus.create({
            id: "translate",
            title: "Translate",
            contexts: ["selection"]
        });

        chrome.contextMenus.onClicked.addListener(function(info, tab) {
            chrome.tabs.sendMessage(tab.id, { operation: "showBubble", text: info.selectedText });
        });
    });
});