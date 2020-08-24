import React = require("react");
import ReactDOM = require('react-dom');
import { TranslateRequest, WordTranslation, TranslateResponse, ChangeWordTranslationStateRequest } from "../base/communicationMessages";

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
                .map(tr => (<WordTranslationComponent key={tr.translation}
                                isInProgress={this.state.wordsInProcess.has(tr)}
                                translation={tr}
                                onTranslationStateChanged={this.handleAddOrRemoveTranslation} />));
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
            this.setState({
                translations: translationReponse.translations,
                wordsInProcess: new Set<WordTranslation>()
            })
        }
    }

    handleAddOrRemoveTranslation(translation: WordTranslation, added: boolean) : void {
        this.setState(oldState => {
            const newSet = new Set<WordTranslation>(oldState.wordsInProcess);
            newSet.add(translation);
            translation.isInDictionary = !translation.isInDictionary;
            const changeTranslations : ChangeWordTranslationStateRequest = {
                newTranslations: this.state.translations.filter(tr => tr.isInDictionary).map(tr => tr.translation),
                sourceTextToTranslate: this.props.sourceText
            }
            chrome.runtime.sendMessage(changeTranslations);

            return {
                wordsInProcess: newSet
            }
        });
    }
}

export interface WordTranslationInfo {
    translation: WordTranslation;
    isInProgress: boolean;
    onTranslationStateChanged: ((translation: WordTranslation, added: boolean) => void)
}

export class WordTranslationComponent extends React.Component<WordTranslationInfo> {
    constructor(props: WordTranslationInfo) {
        super(props);
        this.handleInputClicked = this.handleInputClicked.bind(this);
    }

    render() {
        return (<label className="anki-one-click-translation-choice">
            <div className="anki-one-click-checkbox-container">
                <input type="checkbox"
                    checked={this.props.translation.isInDictionary}
                    disabled={this.props.isInProgress}
                    onChange={this.handleInputClicked} />
            </div>

            {this.props.translation.translation}
        </label>);
    }

    handleInputClicked(event: React.ChangeEvent<HTMLInputElement>) : void {
        this.props.onTranslationStateChanged(this.props.translation, event.target.checked);
    }
}