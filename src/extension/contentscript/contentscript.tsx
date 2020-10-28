import './contentscript.scss';
import * as React from "react";
import ReactDOM = require('react-dom');
import { BubblePopup } from './bubblepopup';

var container = document.createElement('div');
container.setAttribute('id', 'anki-one-click-bubble-host');
document.documentElement.appendChild(container);

const bubble = <BubblePopup />;
ReactDOM.render(bubble, container);