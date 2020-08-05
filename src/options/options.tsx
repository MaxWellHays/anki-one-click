import './options.scss';
import './options.html';
import * as React from "react";
import ReactDOM = require('react-dom');

enum OptionStatus {
    Loading,
    Loaded,
    Saving,
    Saved
}

export interface OptionsComponentState {
    status: OptionStatus;
    yandexTranslateApiKey?: string;
}

export class OptionsComponent extends React.Component<any, OptionsComponentState> {
    constructor(props: any) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.state = {
            status: OptionStatus.Loading,
            yandexTranslateApiKey: "",
        };
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <label>
                    Yandex Translate API Key:
                    <input type="text" disabled={this.state.status == OptionStatus.Loading || this.state.status == OptionStatus.Saving} value={this.state.yandexTranslateApiKey} onChange={this.handleChange} />
                </label>
                <input type="submit" value="Save" />
                <div className="saved-status" hidden={this.state.status != OptionStatus.Saved}>✔ Options saved</div>
            </form>
        );
    }

    handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
        this.setState({ yandexTranslateApiKey: event.target.value });
    }

    handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
        this.setState({
            status: OptionStatus.Saving,
        })
        chrome.storage.sync.set(this.state, () => {
            this.setState({
                status: OptionStatus.Saved
            });
            setTimeout(() => {
                this.setState(state => {
                    if (state.status == OptionStatus.Saved) {
                        return {
                            status: OptionStatus.Loaded
                        }
                    }
                    return state;
                });
            }, 750);
        });
        event.preventDefault();
    }

    componentDidMount() {
        chrome.storage.sync.get(items => {
            this.setState({
                status: OptionStatus.Loaded,
                yandexTranslateApiKey: items["yandexTranslateApiKey"],
            })
        });
    }

    componentWillUnmount() {

    }
}

var container = document.getElementsByClassName("container")[0];
const options = <OptionsComponent />
ReactDOM.render(options, container);