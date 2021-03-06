import './options.scss';
import './options.html';
import * as React from "react";
import ReactDOM = require('react-dom');
import Select from 'react-select';
import { DeckId } from '../base/ankiConnectApi';
import { ExtensionOptions, TriggerKey } from '../base/extensionOptions';
import * as Messages from '../base/communicationMessages';
import { Subscription } from 'rxjs';

enum OptionStatus {
    Loading,
    Loaded,
    Saving,
    Saved
}

export interface OptionsComponentState extends ExtensionOptions {
    status: OptionStatus;
}

export class OptionType {
    value: DeckId;
    label: string;
}

export class OptionsComponent extends React.Component<any, OptionsComponentState> {
    subscriptions: Subscription[];

    constructor(props: any) {
        super(props);

        this.subscriptions = [];

        this.handleSubmit = this.handleSubmit.bind(this);

        this.state = {
            status: OptionStatus.Loading,
            availableDecks: [],
            popupOnDoubleClick: false,
            popupOnSelect: false,
            targetDeck: { id: 0, name: "" },
            yandexDictionaryApiKey: "",
            popupOnDoubleClickTriggerKey: TriggerKey.None,
            popupOnSelectTriggerKey: TriggerKey.None,
        };
    }

    render() {
        const isDisabled = this.state.status == OptionStatus.Loading || this.state.status == OptionStatus.Saving;
        const options = this.state.availableDecks.map(d => this.convertToSelectOption(d)) ?? [];
        const selectedOption = options.find(option => option.value.id == this.state?.targetDeck.id);

        return (
            <form onSubmit={this.handleSubmit}>
                <div className="option-row">
                    <div className="option-name">Yandex Dictionary API Key:</div>
                    <div className="option-value">
                        <input type="text"
                            disabled={isDisabled}
                            value={this.state.yandexDictionaryApiKey}
                            onChange={input => this.setState({ yandexDictionaryApiKey: input.target.value })} />
                    </div>
                </div>
                <div className="option-row">
                    <div className="option-name">Target Anki Deck:</div>
                    <div className="option-value">
                        <Select
                            isDisabled={isDisabled}
                            value={selectedOption}
                            onChange={(val: OptionType) => this.setState({ targetDeck: val.value })}
                            options={options} />
                    </div>
                </div>
                <div className="option-row">
                    <div className="option-name">Pop-up definitions:</div>
                    <div className="option-value">
                        <div className="option-value-primary">
                            <label>
                                <input type="checkbox"
                                    disabled={isDisabled}
                                    checked={this.state.popupOnDoubleClick}
                                    onChange={val => this.setState({ popupOnDoubleClick: val.target.checked })} />
                                    Display pop-up when I double-click a word
                            </label>
                        </div>
                        <div className="option-value-secondary">
                            <span>Trigger key:</span>
                            <select disabled={isDisabled || !this.state.popupOnDoubleClick}
                                value={this.state.popupOnDoubleClickTriggerKey}
                                onChange={val => this.setState({ popupOnDoubleClickTriggerKey: parseInt(val.target.value) })}>
                                <option value={TriggerKey.None}>None</option>
                                <option value={TriggerKey.Ctrl}>Ctrl</option>
                                <option value={TriggerKey.Alt}>Alt</option>
                                <option value={TriggerKey.Shilf}>Shift</option>
                            </select>
                        </div>
                        <div className="option-value-primary">
                            <label >
                                <input type="checkbox"
                                    disabled={isDisabled}
                                    checked={this.state.popupOnSelect}
                                    onChange={val => this.setState({ popupOnSelect: val.target.checked })} />
                                Display pop-up when I select a word or phrase
                            </label>
                        </div>
                        <div className="option-value-secondary">
                            <span>Trigger key:</span>
                            <select disabled={isDisabled || !this.state.popupOnSelect}
                                value={this.state.popupOnSelectTriggerKey}
                                onChange={val => this.setState({ popupOnSelectTriggerKey: parseInt(val.target.value) })}>
                                <option value={TriggerKey.None}>None</option>
                                <option value={TriggerKey.Ctrl}>Ctrl</option>
                                <option value={TriggerKey.Alt}>Alt</option>
                                <option value={TriggerKey.Shilf}>Shift</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="option-row">
                    <input type="submit" value="Save" disabled={isDisabled} />
                    <div className="saved-status" hidden={this.state.status != OptionStatus.Saved}>✔ Options saved</div>
                </div>
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

    handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
        this.setState({
            status: OptionStatus.Saving
        })
        Messages.sendSaveExtensionOptionsRequest(this.state);
        event.preventDefault();
    }

    componentDidMount() {
        this.subscriptions.push(
            Messages.extensionOptionsResponseStream.subscribe(([extensionOptions]) => {
                const newState = extensionOptions as OptionsComponentState;
                newState.status = OptionStatus.Loaded;
                this.setState(newState);
            })
        )
        this.subscriptions.push(
            Messages.saveExtensionOptionsResponseStream.subscribe(([res]) => {
                this.setState({
                    status: OptionStatus.Saved
                });
                setTimeout(() => {
                    if (this.state.status == OptionStatus.Saved) {
                        this.setState({
                            status: OptionStatus.Loaded
                        });
                    }
                }, 750);
            })
        )
        Messages.sendExtensionOptionsRequest(null);
    }

    componentWillUnmount() {
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.subscriptions = [];
    }
}

var container = document.getElementsByClassName("container")[0];
const options = <OptionsComponent />
ReactDOM.render(options, container);