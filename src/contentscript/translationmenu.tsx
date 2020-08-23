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
            const translationsList = this.state.translations.map(tr => <li key={tr.translation}>{tr.translation}</li>);
            translations = (<ul>
                {translationsList}
            </ul>);
        }
        else {
            translations = null;
        }
        return (
            <div>
                <div>
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