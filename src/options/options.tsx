import './options.scss';
import './options.html';
import * as React from "react";
import ReactDOM = require('react-dom');
import Select, { ValueType, ActionMeta } from 'react-select';
import { DeckId } from '../base/ankiConnectApi';
import { ExtensionOptions } from '../base/extensionOptions';
import { GetExtensionOptionsRequest, GetExtensionOptionsResponse, SaveExtensionOptionsRequest } from '../base/communicationMessages';

enum OptionStatus {
    Loading,
    Loaded,
    Saving,
    Saved
}

export interface OptionsComponentState {
    status: OptionStatus;
    settings?: ExtensionOptions;
}

export class OptionType {
    value: DeckId;
    label: string;
}

export class OptionsComponent extends React.Component<any, OptionsComponentState> {
    constructor(props: any) {
        super(props);

        this.handleApiKeyChange = this.handleApiKeyChange.bind(this);
        this.handleTargetDeckChange = this.handleTargetDeckChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleRuntimeMessage = this.handleRuntimeMessage.bind(this);

        this.state = {
            status: OptionStatus.Loading,
            settings: null
        };
    }

    render() {
        const isDisabled = this.state.status == OptionStatus.Loading || this.state.status == OptionStatus.Saving;
        const options = this.state.settings?.availableDecks.map(d => this.convertToSelectOption(d)) ?? [];
        const selectedOption = options.find(option => option.value.id == this.state.settings?.targetDeck.id);

        return (
            <form onSubmit={this.handleSubmit}>
                <label>
                    Yandex Dictionary API Key:
                    <input type="text" disabled={isDisabled} value={this.state.settings?.yandexDictionaryApiKey} onChange={this.handleApiKeyChange} />
                </label>
                <label>
                    Target Anki Deck:
                    <Select
                        isDisabled={isDisabled}
                        value={selectedOption}
                        options={options}
                        onChange={this.handleTargetDeckChange}
                    />
                </label>
                <input type="submit" value="Save" />
                <div className="saved-status" hidden={this.state.status != OptionStatus.Saved}>✔ Options saved</div>
            </form>
        );
    }

    convertToSelectOption(deck: DeckId): OptionType {
        var res: OptionType = {
            label: deck.name,
            value: deck
        }
        return res;
    }

    handleApiKeyChange(event: React.ChangeEvent<HTMLInputElement>): void {
        this.setState(
            {
                settings:
                {
                    yandexDictionaryApiKey: event.target.value,
                    availableDecks: this.state.settings.availableDecks,
                    targetDeck: this.state.settings.targetDeck,
                }
            });
    }

    handleTargetDeckChange(newDeckChoice?: OptionType, actionMeta?: ActionMeta<OptionType>): void {
        if (newDeckChoice) {
            this.setState(
                {
                    settings:
                    {
                        yandexDictionaryApiKey: this.state.settings.yandexDictionaryApiKey,
                        availableDecks: this.state.settings.availableDecks,
                        targetDeck: newDeckChoice.value,
                    }
                });
        }
        else {
            this.setState(
                {
                    settings:
                    {
                        yandexDictionaryApiKey: this.state.settings.yandexDictionaryApiKey,
                        availableDecks: this.state.settings.availableDecks,
                        targetDeck: null,
                    }
                });
        }
    }

    handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
        this.setState({
            status: OptionStatus.Saving,
        })
        const request : SaveExtensionOptionsRequest = {
            extensionOptionsToSave: this.state.settings
        }
        chrome.runtime.sendMessage(request);
        event.preventDefault();
    }

    componentDidMount() {
        chrome.runtime.onMessage.addListener(this.handleRuntimeMessage);
        const request: GetExtensionOptionsRequest = {
            optionsRequest: "options"
        }
        chrome.runtime.sendMessage(request);
    }

    componentWillUnmount() {
        chrome.runtime.onMessage.removeListener(this.handleRuntimeMessage);
    }

    handleRuntimeMessage(message : any, sender : chrome.runtime.MessageSender) : void {
        if (message && message.extensionOptions) {
            var optionsReponse = message as GetExtensionOptionsResponse;
            this.setState({
                status: OptionStatus.Loaded,
                settings: optionsReponse.extensionOptions
            });
        }
        if (message && message.optionsSaved) {
            this.setState({
                status: OptionStatus.Saved
            });
            setTimeout(() => {
                this.setState(state => {
                    if (state.status == OptionStatus.Saved) {
                        return {
                            status: OptionStatus.Loaded,
                            availableDecks: state.settings.availableDecks
                        }
                    }
                    return state;
                });
            }, 750);
        }
    }
}

var container = document.getElementsByClassName("container")[0];
const options = <OptionsComponent />
ReactDOM.render(options, container);