import React = require("react");
import ReactDOM = require('react-dom');
import { TranslateRequest, WordTranslation, TranslateResponse } from "../base/communicationMessages";

export interface TranslationMenuSourceInfo {
    sourceText: string;
}

export interface TranslationMenuState {
    translations?: WordTranslation[];
    wordsInProcess: Set<WordTranslation>;
}

export class TranslationMenu extends React.Component<TranslationMenuSourceInfo, TranslationMenuState> {

    constructor(props: TranslationMenuSourceInfo) {
        super(props);
        this.handleChromeRuntimeMessage = this.handleChromeRuntimeMessage.bind(this);
        this.handleAddOrRemoveTranslation = this.handleAddOrRemoveTranslation.bind(this);
        this.state = {
            translations: null,
            wordsInProcess: new Set<WordTranslation>(),
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
            const translationsList = this.state.translations
                .map(tr => {
                    if (this.state.wordsInProcess.has(tr)) {
                        return (<div className="anki-one-click-translation-choice">
                            <div className="anki-one-click-spinner" />
                            {tr.translation}
                        </div>);
                    }
                    else {
                        return (<WordTranslationComponent key={tr.translation}
                                    translation={tr}
                                    onTranslationStateChanged={this.handleAddOrRemoveTranslation} />);
                    }
                });

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

    handleAddOrRemoveTranslation(translation: WordTranslation, added: boolean) : void {
        this.setState(oldState => {
            const newSet = new Set<WordTranslation>(oldState.wordsInProcess);
            newSet.add(translation);

            return {
                wordsInProcess: newSet
            }
        });
    }
}

export interface WordTranslationInfo {
    translation: WordTranslation;
    onTranslationStateChanged: ((translation: WordTranslation, added: boolean) => void)
}

export class WordTranslationComponent extends React.Component<WordTranslationInfo> {
    constructor(props: WordTranslationInfo) {
        super(props);
        this.handleInputClicked = this.handleInputClicked.bind(this);
    }

    render() {
        return (<label className="anki-one-click-translation-choice">
            <input type="checkbox" checked={this.props.translation.isInDictionary} onClick={this.handleInputClicked} />
            {this.props.translation.translation}
        </label>);
    }

    handleInputClicked(event: React.MouseEvent<HTMLInputElement, MouseEvent>) : void {
        this.props.onTranslationStateChanged(this.props.translation, !this.props.translation.isInDictionary);
    }
}