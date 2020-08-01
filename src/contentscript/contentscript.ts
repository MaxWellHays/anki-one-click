import './contentscript.scss';

var bubbleDOM = document.createElement('div');
bubbleDOM.setAttribute('class', 'selection_bubble');
document.body.appendChild(bubbleDOM);

function renderBubble(mouseX: number, mouseY: number, selection: string): void {
    bubbleDOM.innerHTML = selection;
    bubbleDOM.style.top = mouseY.toString() + 'px';
    bubbleDOM.style.left = mouseX.toString() + 'px';
    bubbleDOM.style.visibility = 'visible';
}

function showBubble(): void {
    var s = window.getSelection();
    var rect = s.getRangeAt(0).getBoundingClientRect();
    var selection = s.toString();
    if (selection.length > 0) {
        renderBubble(rect.right, rect.top, selection);
    }
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