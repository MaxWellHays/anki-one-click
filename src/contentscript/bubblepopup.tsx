import './contentscript.scss';
import * as React from "react";
import ReactDOM = require('react-dom');
import { TranslationMenu } from '../base/translationmenu';
import * as Messages from '../base/communicationMessages';
import { ExtensionOptions, TriggerKey } from '../base/extensionOptions';
import { SelectionHelper } from './selectionhelper';
import { Subscription } from 'rxjs';

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
    subscriptions: Subscription[];

    constructor(props: BubbleViewModel) {
        super(props);
        this.subscriptions = [];
        this.handleMouseUp = this.handleMouseUp.bind(this);
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
        document.addEventListener('dblclick', this.handleDoubleClick);
        this.subscriptions.push(
            Messages.showBubbleRequestStream.subscribe(() => this.showBubble())
        );
        this.subscriptions.push(
            Messages.extensionOptionsResponseStream.subscribe(([response]) => this.options = response)
        );
        Messages.sendExtensionOptionsRequest(null);
    }

    componentWillUnmount() {
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('dblclick', this.handleDoubleClick);
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.subscriptions = [];
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