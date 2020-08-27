import './popup.scss';
import './popup.html';
import * as React from "react";
import ReactDOM = require('react-dom');
import { ChangeEvent } from 'react';
import { TranslationMenu } from '../base/translationmenu';
import AwesomeDebouncePromise from 'awesome-debounce-promise';

export interface PopupState {
    enteredText : string;
    requestedText? : string;
}

const requestTranslationsDebounced = AwesomeDebouncePromise((text : string) => text, 500);

export class PopupComponent extends React.Component<any, PopupState> {
    wordInput: HTMLInputElement;

    constructor(props : any) {
        super(props);
        this.state = {
            enteredText: "",
            requestedText: null
        }
        this.onInputTextChange = this.onInputTextChange.bind(this);
    }

    render() {
        let translationMenu = null;
        if (this.state.requestedText) {
            translationMenu = <TranslationMenu sourceText={this.state.requestedText} />;
        }
        return (<div>
            <input type="text"
                ref={(input) => {this.wordInput = input; }}
                placeholder="Enter word to translate"
                id="anki-one-click-word-for-translation"
                value={this.state.enteredText}
                onChange={this.onInputTextChange}/>
            {translationMenu}
        </div>);
    }

    componentDidMount() {
        this.wordInput.focus();
    }

    async onInputTextChange(event: ChangeEvent<HTMLInputElement>) : Promise<void> {
        const newText = event.currentTarget.value;
        this.setState({enteredText: newText });
        const res = await requestTranslationsDebounced(newText);
        this.setState({requestedText : res })
    }
}

var container = document.getElementsByClassName("container")[0];
const options = <PopupComponent />
ReactDOM.render(options, container);