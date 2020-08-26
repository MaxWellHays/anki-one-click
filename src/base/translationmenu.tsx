import './translationmenu.scss';
import React = require("react");
import ReactDOM = require('react-dom');
import * as Messages from "./communicationMessages";

export interface TranslationMenuSourceInfo {
    sourceText: string;
}

export interface TranslationMenuState {
    translations?: Messages.WordTranslation[];
    wordsInProcess: Set<Messages.WordTranslation>;
}

export class TranslationMenu extends React.Component<TranslationMenuSourceInfo, TranslationMenuState> {

    constructor(props: TranslationMenuSourceInfo) {
        super(props);
        this.handleChromeRuntimeMessage = this.handleChromeRuntimeMessage.bind(this);
        this.handleAddOrRemoveTranslation = this.handleAddOrRemoveTranslation.bind(this);
        this.state = {
            translations: null,
            wordsInProcess: new Set<Messages.WordTranslation>(),
        }
    }

    componentDidMount() {
        chrome.runtime.onMessage.addListener(this.handleChromeRuntimeMessage);
        const request: Messages.Action = {
            type: "TranslateRequest",
            content: {
                sourceTextToTranslate: this.props.sourceText
            }
        };
        chrome.runtime.sendMessage(request);
    }

    componentWillUnmount() {
        chrome.runtime.onMessage.removeListener(this.handleChromeRuntimeMessage);
    }

    render() {
        let translations;
        if (this.state.translations) {
            translations = <TranslationsListComponent
                handleAddOrRemoveTranslation={this.handleAddOrRemoveTranslation}
                items={this.state} />
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

    handleChromeRuntimeMessage(request: Messages.Action) {
        if (Messages.isTranslateResponse(request)) {
            const translationReponse = request.content;
            this.setState({
                translations: translationReponse.translations,
                wordsInProcess: new Set<Messages.WordTranslation>()
            })
        }
    }

    handleAddOrRemoveTranslation(translation: Messages.WordTranslation, added: boolean): void {
        this.setState(oldState => {
            const newSet = new Set<Messages.WordTranslation>(oldState.wordsInProcess);
            newSet.add(translation);
            translation.isInDictionary = !translation.isInDictionary;
            const changeTranslations: Messages.Action = {
                type: "ChangeWordTranslationStateRequest",
                content: {
                    newTranslations: this.state.translations.filter(tr => tr.isInDictionary).map(tr => tr.translation),
                    sourceTextToTranslate: this.props.sourceText
                }
            }
            chrome.runtime.sendMessage(changeTranslations);

            return {
                wordsInProcess: newSet
            }
        });
    }
}

export interface TranslationsListComponentProps {
    handleAddOrRemoveTranslation: (translation: Messages.WordTranslation, added: boolean) => void;
    items: TranslationMenuState;
}

export class TranslationsListComponent extends React.Component<TranslationsListComponentProps> {
    render() {
        const translationsList = this.props.items.translations.map(tr => (<WordTranslationComponent key={tr.translation}
            isInProgress={this.props.items.wordsInProcess.has(tr)}
            translation={tr}
            onTranslationStateChanged={this.props.handleAddOrRemoveTranslation} />))

        return (<div>
            {translationsList}
        </div>)
    }
}

export interface WordTranslationInfo {
    translation: Messages.WordTranslation;
    isInProgress: boolean;
    onTranslationStateChanged: ((translation: Messages.WordTranslation, added: boolean) => void)
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

    handleInputClicked(event: React.ChangeEvent<HTMLInputElement>): void {
        this.props.onTranslationStateChanged(this.props.translation, event.target.checked);
    }
}