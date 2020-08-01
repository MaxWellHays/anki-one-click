const isThisBackground = true;
console.log('isThisBackground', isThisBackground);

chrome.runtime.onInstalled.addListener(function() {
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
            chrome.tabs.sendMessage(tab.id, { operation: "showBubble", text: info.selectionText });
        });
    });
})