import React = require("react");
import ReactDOM = require('react-dom');
import { TranslateRequest, WordTranslation, TranslateResponse } from "../base/communicationMessages";

export interface TranslationSourceInfo {
    sourceText: string;
}

export interface TranslationState {
    translations?: WordTranslation[];
}

export class TranslationMenu extends React.Component<TranslationSourceInfo, TranslationState> {
    constructor(props: TranslationSourceInfo) {
        super(props);
        this.handleChromeRuntimeMessage = this.handleChromeRuntimeMessage.bind(this);
        this.state = {
            translations: null
        }
    }

    componentDidMount() {
        chrome.runtime.onMessage.addListener(this.handleChromeRuntimeMessage);
        const request : TranslateRequest = {
            sourceTextToTranslate: this.props.sourceText
        };
        chrome.runtime.sendMessage(request);
    }

    componentWillUnmount() {
        chrome.runtime.onMessage.removeListener(this.handleChromeRuntimeMessage);
    }

    render() {
        let translations;
        if (this.state.translations) {
            const translationsList = this.state.translations.map(tr =>
                <WordTranslationComponent key={tr.translation} isInDictionary={tr.isInDictionary} translation={tr.translation} />);
            translations = (<div>
                {translationsList}
            </div>);
        }
        else {
            translations = null;
        }
        return (
            <div>
                <div className="anki-one-click-source-word">
                    {this.props.sourceText}
                </div>
                {translations}
            </div>);
    }

    handleChromeRuntimeMessage(request: any) {
        if (request.translations && request.sourceTextToTranslate == this.props.sourceText) {
            const translationReponse = request as TranslateResponse;
            this.setState({translations: translationReponse.translations})
        }
    }
}

export class WordTranslationComponent extends React.Component<WordTranslation> {
    constructor(props: WordTranslation) {
        super(props);
        this.getStatusSymbol = this.getStatusSymbol.bind(this);
    }

    render() {
        return (<div>
            {this.getStatusSymbol()}
            {this.props.translation}
        </div>);
    }

    getStatusSymbol() : string {
        if (this.props.isInDictionary) {
            return "☑️"
        }
        return "⬜";
    }
}