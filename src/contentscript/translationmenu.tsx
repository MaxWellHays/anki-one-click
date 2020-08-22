import React = require("react");
import ReactDOM = require('react-dom');

export interface TranslationSourceInfo {
    sourceText: string;
}

export interface TranslationState {
    translations?: string[];
}

export interface TranslateResponse {
    def:  Def[];
}

export interface Def {
    text: string;
    pos:  string;
    ts:   string;
    tr:   Tr[];
}

export interface Tr {
    text: string;
    pos:  string;
    gen?: string;
    mean: Mean[];
    ex?:  Ex[];
    syn?: Syn[];
    asp?: string;
}

export interface Ex {
    text: string;
    tr:   Mean[];
}

export interface Mean {
    text: string;
}

export interface Syn {
    text: string;
    pos:  string;
    gen?: string;
    asp?: string;
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
        chrome.runtime.sendMessage({
            sourceTextToTranslate: this.props.sourceText
        })
        chrome.runtime.onMessage.addListener(this.handleChromeRuntimeMessage);
    }

    componentWillUnmount() {
        chrome.runtime.onMessage.removeListener(this.handleChromeRuntimeMessage);
    }

    render() {
        let translations;
        if (this.state.translations) {
            const translationsList = this.state.translations.map(tr => <li key={tr}>{tr}</li>);
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
        if (request.translation && request.sourceTextToTranslate == this.props.sourceText) {
            const translationReponse = request.translation as TranslateResponse;
            const definitions = translationReponse.def;
            const translations = [];

            let hasNewDefs = true;
            let i = 0;
            while (hasNewDefs) {
                hasNewDefs = false;
                for (let definition of definitions) {
                    if (i < definition.tr.length) {
                        hasNewDefs = true;
                        translations.push(definition.tr[i].text)
                    }
                }
                i++;
            }

            this.setState({translations: translations})
        }
    }
}