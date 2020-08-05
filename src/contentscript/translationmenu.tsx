import React = require("react");
import ReactDOM = require('react-dom');

export interface TranslationSourceInfo {
    sourceText: string;
}

export interface TranslationState {
    translation?: string;
}

export class TranslationMenu extends React.Component<TranslationSourceInfo, TranslationState> {
    constructor(props: TranslationSourceInfo) {
        super(props);
        this.state = {
            translation: null
        }
    }

    componentDidMount() {
        chrome.runtime.sendMessage({
            sourceTextToTranslate: this.props.sourceText
        })
    }

    componentWillUnmount() {
    }

    render() {
        return <div>{this.props.sourceText}</div>;
    }
}