import './contentscript.scss';
import * as React from "react";
import ReactDOM = require('react-dom');

var container = document.createElement('div');
container.setAttribute('class', 'anki-one-click-container');
document.body.appendChild(container);

export interface SelectionInfo {
    text: string;
    rect: DOMRect;
}

export interface BubbleViewModel {
    currentSelection?: SelectionInfo;
}

export class BubblePopup extends React.Component<BubbleViewModel> {
    render() {
        if (this.props.currentSelection)
        {
            return <div className="selection_bubble" style={{top: this.props.currentSelection.rect.top, left: this.props.currentSelection.rect.right, visibility: "visible"}}>{this.props.currentSelection.text}</div>
        }
        else {
            return <div className="selection_bubble"></div>
        }
    }
}

const bubble = <BubblePopup />;
ReactDOM.render(bubble, container);

function showBubble(): void {
    var s = window.getSelection();
    const selectionInfo : SelectionInfo = {
        rect: s.getRangeAt(0).getBoundingClientRect(),
        text: s.toString(),
    }
    if (selectionInfo.text.length > 0) {
        const bubble = <BubblePopup currentSelection={selectionInfo} />;
        ReactDOM.render(bubble, container)
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