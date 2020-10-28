import './translationmenu.scss';
import React = require("react");
import ReactDOM = require('react-dom');
import * as Messages from "./communicationMessages";
import { Subscription } from 'rxjs';

export interface TranslationMenuSourceInfo {
    contextText: string;
    selectionText: string;
    selectionStart: number;
    selectionLength: number;
}

export interface TranslationMenuState {
    translations?: Messages.WordTranslation[];
    wordsInProcess: Set<Messages.WordTranslation>;
}

export class TranslationMenu extends React.Component<TranslationMenuSourceInfo, TranslationMenuState> {
    subscribtions: Subscription[];

    constructor(props: TranslationMenuSourceInfo) {
        super(props);
        this.handleAddOrRemoveTranslation = this.handleAddOrRemoveTranslation.bind(this);
        this.subscribtions = [];
        this.state = {
            translations: null,
            wordsInProcess: new Set<Messages.WordTranslation>(),
        }
    }

    componentDidMount() {
        this.subscribtions.push(
            Messages.translateResponseStream.subscribe(([transpationResponse]) => {
                if (transpationResponse.sourceTextToTranslate === this.props.selectionText) {
                    this.setState({
                        translations: transpationResponse.translations
                    })
                }
            }));
        Messages.sendTranslateRequest({
            contextSentence: this.props.contextText,
            selectionLength: this.props.selectionLength,
            selectionStart: this.props.selectionStart,
        });
    }

    componentWillUnmount() {
        for (let sub of this.subscribtions) {
            sub.unsubscribe();
        }
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
                    {this.props.selectionText}
                </div>
                {translations}
            </div>);
    }

    handleAddOrRemoveTranslation(translation: Messages.WordTranslation, added: boolean): void {
        this.setState(oldState => {
            const newSet = new Set<Messages.WordTranslation>(oldState.wordsInProcess);
            newSet.add(translation);
            translation.isInDictionary = !translation.isInDictionary;

            Messages.sendChangeTranslationStateRequest({
                newTranslations: this.state.translations.filter(tr => tr.isInDictionary).map(tr => tr.translation),
                sourceTextToTranslate: this.props.selectionText
            });

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