import './contentscript.scss';
import * as React from "react";
import ReactDOM = require('react-dom');
import { TranslationMenu } from './translationmenu';

export interface SelectionInfo {
    text: string;
    rect: DOMRect;
}

export interface BubbleViewModel {
}

export interface BubbleState {
    visible: boolean;
    currentSelection?: SelectionInfo;
}

export class BubblePopup extends React.Component<BubbleViewModel, BubbleState> {
    constructor(props: BubbleViewModel) {
        super(props);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleChromeRuntimeMessage = this.handleChromeRuntimeMessage.bind(this);
        this.state = {
            visible: false,
            currentSelection: null,
        }
    }

    render() {
        if (this.state.visible && this.state.currentSelection) {
            return (<div className="selection_bubble"
                style={this.createBubbleProperties(this.state.currentSelection.rect)}>
                <TranslationMenu sourceText={this.state.currentSelection.text} />
            </div>);
        }
        return null;
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
        chrome.runtime.onMessage.addListener(this.handleChromeRuntimeMessage);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
        chrome.runtime.onMessage.removeListener(this.handleChromeRuntimeMessage);
    }

    handleClickOutside(event: MouseEvent): void {
        const domNode = ReactDOM.findDOMNode(this);
        const target = event.target as Node;

        if (!domNode || !domNode.contains(target)) {
            this.setState({
                visible: false
            });
        }
    }

    handleChromeRuntimeMessage(request: any) {
        if (request.operation == "showBubble") {
            const selection = window.getSelection();
            const selectionText = selection.toString();
            if (selectionText.length > 0 && this.isSourceLanguageText(selectionText)) {
                const rect = selection.getRangeAt(0).getBoundingClientRect();
                const selectionInfo: SelectionInfo = {
                    rect: this.offset(rect, window.pageXOffset, window.pageYOffset),
                    text: selection.toString().trim(),
                }
                this.setState({
                    visible: true,
                    currentSelection: selectionInfo,
                });
            }
        }
    }

    createBubbleProperties(selectionRect: DOMRect): React.CSSProperties {
        return {
            top: selectionRect.top,
            left: selectionRect.right
        };
    }

    offset(rect: DOMRect, xOffset: number, yOffset: number): DOMRect {
        return new DOMRect(rect.x + xOffset, rect.y + yOffset, rect.width, rect.height);
    }

    isSourceLanguageText(text: string): boolean {
        return (/^[a-zA-Z ]+$/.test(text));
    }
}