import './contentscript.scss';
import * as React from "react";
import ReactDOM = require('react-dom');
import { TranslationMenu } from './translationmenu';
import { GetExtensionOptionsRequest } from '../base/communicationMessages';
import { ExtensionOptions, TriggerKey } from '../base/extensionOptions';
import { SelectionHelper } from './selectionhelper';

export interface SelectionInfo {
    text: string;
    rect: DOMRect;
    context: string;
}

export interface BubbleViewModel {
}

export interface BubbleState {
    visible: boolean;
    currentSelection?: SelectionInfo;
}

export class BubblePopup extends React.Component<BubbleViewModel, BubbleState> {
    options?: ExtensionOptions;
    selectionHelper: SelectionHelper;

    constructor(props: BubbleViewModel) {
        super(props);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleChromeRuntimeMessage = this.handleChromeRuntimeMessage.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.showBubble = this.showBubble.bind(this);
        this.checkTriggerKey = this.checkTriggerKey.bind(this);
        this.selectionHelper = new SelectionHelper();
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
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('dblclick', this.handleDoubleClick)
        chrome.runtime.onMessage.addListener(this.handleChromeRuntimeMessage);
        const request : GetExtensionOptionsRequest = {optionsRequest: "contentScript"}
        chrome.runtime.sendMessage(request);
    }

    componentWillUnmount() {
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('dblclick', this.handleDoubleClick);
        chrome.runtime.onMessage.removeListener(this.handleChromeRuntimeMessage);
    }

    handleMouseUp(event: MouseEvent): void {

        if (this.state.visible) {
            const domNode = ReactDOM.findDOMNode(this);
            const target = event.target as Node;
            if (!domNode || !domNode.contains(target))
            this.setState({
                visible: false
            });
        }

        if (this.options
            && this.options.popupOnSelect
            && event.button == 0
            && this.checkTriggerKey(event, this.options.popupOnSelectTriggerKey)) {
                this.showBubble();
            }
    }

    handleDoubleClick(event: MouseEvent): void {
        if (this.options
            && this.options.popupOnDoubleClick
            && event.button == 0
            && this.checkTriggerKey(event, this.options.popupOnDoubleClickTriggerKey)) {
            this.showBubble();
        }
    }

    handleChromeRuntimeMessage(request: any) {
        if (request.operation == "showBubble") {
            this.showBubble();
        }
        if (request.extensionOptions) {
            this.options = request.extensionOptions as ExtensionOptions;
        }
    }

    checkTriggerKey(event: MouseEvent, triggerKey: TriggerKey) : boolean {
        return triggerKey == TriggerKey.None
            || triggerKey == TriggerKey.Alt && event.altKey
            || triggerKey == TriggerKey.Ctrl && event.ctrlKey
            || triggerKey == TriggerKey.Shilf && event.shiftKey;
    }

    showBubble() : void {
        const selection = window.getSelection();
        const selectionText = selection.toString().trim();
        if (selectionText.length > 0 && this.isSourceLanguageText(selectionText)) {
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            const selectionInfo: SelectionInfo = {
                rect: this.offset(rect, window.pageXOffset, window.pageYOffset),
                text: selection.toString().trim(),
                context: this.selectionHelper.extractContext(selection)
            }
            this.setState({
                visible: true,
                currentSelection: selectionInfo,
            });
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