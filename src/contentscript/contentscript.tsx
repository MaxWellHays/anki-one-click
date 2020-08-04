import './contentscript.scss';
import * as React from "react";
import ReactDOM = require('react-dom');

var container = document.createElement('div');
container.setAttribute('id', 'anki-one-click-bubble-host');
document.documentElement.appendChild(container);

export interface SelectionInfo {
    text: string;
    rect: DOMRect;
}

export interface BubbleViewModel {
    currentSelection?: SelectionInfo;
}

export class BubblePopup extends React.Component<BubbleViewModel> {
    render() {
        if (this.props.currentSelection) {
            return (<div className="selection_bubble"
                style={this.createBubbleProperties(this.props.currentSelection.rect)}>
                {this.props.currentSelection.text}
            </div>);
        }
        return null;
    }

    createBubbleProperties(selectionRect: DOMRect): React.CSSProperties {
        return {
            top: selectionRect.top,
            left: selectionRect.right,
            visibility: "visible",
        };
    }
}

const bubble = <BubblePopup />;
ReactDOM.render(bubble, container);

function showBubble(): void {
    var selection = window.getSelection();
    var rect = selection.getRangeAt(0).getBoundingClientRect();
    const selectionInfo: SelectionInfo = {
        rect: offset(rect, window.pageXOffset, window.pageYOffset),
        text: selection.toString(),
    }
    if (selectionInfo.text.length > 0) {
        const bubble = <BubblePopup currentSelection={selectionInfo} />;
        ReactDOM.render(bubble, container)
    }
}

function offset(rect : DOMRect, xOffset : number, yOffset : number) : DOMRect {
    return new DOMRect(rect.x + xOffset, rect.y + yOffset, rect.width, rect.height);
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