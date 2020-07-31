// Add bubble to the top of the page.
var bubbleDOM = document.createElement('div');
bubbleDOM.setAttribute('class', 'selection_bubble');
document.body.appendChild(bubbleDOM);

function showBubble() {
    var s = window.getSelection();
    var rect = s.getRangeAt(0).getBoundingClientRect();
    var selection = s.toString();
    if (selection.length > 0) {
        renderBubble(rect.right, rect.top, selection);
    }
}

function hideBubble() {
    bubbleDOM.style.visibility = 'hidden';
}

// Move that bubble to the appropriate location.
function renderBubble(mouseX, mouseY, selection) {
    bubbleDOM.innerHTML = selection;
    bubbleDOM.style.top = mouseY + 'px';
    bubbleDOM.style.left = mouseX + 'px';
    bubbleDOM.style.visibility = 'visible';
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.operation == "showBubble") {
            showBubble();
        }
    });