interface SelectionEx extends Selection {
    modify(alter: string, direction: string, granularity: string): void;
}

export interface SelectionInfo {
    selectionText: string;
    contextText: string;
    rect: DOMRect;
    selectionOffsetInContext: number;
    selectionLength: number;
}

export class SelectionHelper {

    constructor() {
        this.getSelection = this.getSelection.bind(this);
        this.extractContext = this.extractContext.bind(this);
    }

    getSelection(): SelectionInfo | null {
        const selection = window.getSelection();
        const selectionText = selection.toString().trim();
        if (selectionText.length == 0 || !this.isSourceLanguageText(selectionText)) {
            return null;
        }

        let rect = selection.getRangeAt(0).getBoundingClientRect();
        if (rect.height === rect.width && rect.width === 0 && this.isInputFieldElement(document.activeElement)) {
            const inputElement = document.activeElement as HTMLInputElement;
            rect = this.getTextBoundingRect(inputElement, inputElement.selectionStart, inputElement.selectionEnd, false);
        }

        const selectionContext = this.extractContext(selection);
        return {
            contextText: selectionContext[0],
            rect: this.offset(rect, window.pageXOffset, window.pageYOffset),
            selectionText: selectionText,
            selectionLength: selectionText.length,
            selectionOffsetInContext: selectionContext[1]
        }
    }

    offset(rect: DOMRect, xOffset: number, yOffset: number): DOMRect {
        return new DOMRect(rect.x + xOffset, rect.y + yOffset, rect.width, rect.height);
    }

    isSourceLanguageText(text: string): boolean {
        return (/^[a-zA-Z ]+$/.test(text));
    }

    extractContext(selection: Selection): [contextText: string, selectionOffset: number] {
        const selEx = selection as SelectionEx;
        const activeElement = document.activeElement;

        let toRestore: {
            type: "simple",
            range: Range
        } | {
            type: "input",
            selectionStart: number,
            selectionEnd: number,
        };
        if (this.isInputFieldElement(activeElement)) {
            const inputElement = activeElement as HTMLInputElement;
            toRestore = {
                type: "input",
                selectionStart: inputElement.selectionStart,
                selectionEnd: inputElement.selectionEnd
            }
        }
        else {
            toRestore = {
                type: "simple",
                range: selEx.getRangeAt(0).cloneRange()
            }
        }

        selEx.modify("move", "left", "sentence");
        selEx.modify("extend", "right", "sentence");

        const contextText = selEx.toString();
        const selectionStartPosition = toRestore.type == "simple"
            ? toRestore.range.startOffset - selEx.getRangeAt(0).startOffset
            : toRestore.selectionStart - (activeElement as HTMLInputElement).selectionStart;

        if (toRestore.type == "simple") {
            selEx.removeAllRanges();
            selEx.addRange(toRestore.range);
        }
        else {
            const inputElement = activeElement as HTMLInputElement;
            inputElement.setSelectionRange(toRestore.selectionStart, toRestore.selectionEnd);
        }

        return [contextText, selectionStartPosition];
    }

    isInputFieldElement(element: Element): boolean {
        const tagName = element.tagName?.toLowerCase();
        return tagName === "textarea"
            || tagName === "input" && (element as HTMLInputElement).type === "text";
    }

    listOfModifiers = ['direction', 'font-family', 'font-size', 'font-size-adjust', 'font-variant', 'font-weight', 'font-style', 'letter-spacing', 'line-height', 'text-align', 'text-indent', 'text-transform', 'word-wrap', 'word-spacing'];

    // https://stackoverflow.com/a/7948715/3029359
    getTextBoundingRect(input: HTMLInputElement, selectionStart: number, selectionEnd: number, debug: boolean) : DOMRect {
        const offset = this.getInputOffset(input);
        let topPos = offset.top;
        let leftPos = offset.left;
        const width = this.getInputCSS(input, 'width', true);
        const height = this.getInputCSS(input, 'height', true);

        // Styles to simulate a node in an input field

        topPos += this.getInputCSS(input, 'padding-top', true);
        topPos += this.getInputCSS(input, 'border-top-width', true);
        leftPos += this.getInputCSS(input, 'padding-left', true);
        leftPos += this.getInputCSS(input, 'border-left-width', true);
        leftPos += 1; //Seems to be necessary

        let cssDefaultStyles = "white-space:pre;padding:0;margin:0;";
        for (var i = 0; i < this.listOfModifiers.length; i++) {
            var property = this.listOfModifiers[i];
            cssDefaultStyles += property + ':' + this.getInputCSS(input, property, false) + ';';
        }
        // End of CSS variable checks

        const text = input.value;
        const textLen = text.length;
        const fakeClone = document.createElement("div");

        if (selectionStart > 0) {
            this.appendPart(cssDefaultStyles, text, 0, selectionStart, fakeClone);
        }

        var fakeRange = this.appendPart(cssDefaultStyles, text, selectionStart, selectionEnd, fakeClone);
        if (textLen > selectionEnd) {
            this.appendPart(cssDefaultStyles, text, selectionEnd, textLen, fakeClone);
        }

        // Styles to inherit the font styles of the element
        fakeClone.style.cssText = cssDefaultStyles;

        // Styles to position the text node at the desired position
        fakeClone.style.position = "absolute";
        fakeClone.style.top = topPos + "px";
        fakeClone.style.left = leftPos + "px";
        fakeClone.style.width = width + "px";
        fakeClone.style.height = height + "px";
        document.body.appendChild(fakeClone);
        const returnValue = fakeRange.getBoundingClientRect(); //Get rect

        if (!debug) {
            fakeClone.parentNode.removeChild(fakeClone) //Remove temp
        };

        return returnValue;
    }

    getInputCSS(input: HTMLInputElement, prop: string, isnumber: true) : number;
    getInputCSS(input: HTMLInputElement, prop: string, isnumber: false) : string;
    getInputCSS(input: HTMLInputElement, prop: string, isnumber: boolean) : string | number {
        var val = document.defaultView.getComputedStyle(input, null).getPropertyValue(prop);
        return isnumber ? parseFloat(val) : val;
    }

    appendPart(cssDefaultStyles:string, text:string, start: number, end: number, fakeClone: HTMLDivElement): HTMLSpanElement {
        const span = document.createElement("span");
        span.style.cssText = cssDefaultStyles; //Force styles to prevent unexpected results
        span.textContent = text.substring(start, end);
        fakeClone.appendChild(span);
        return span;
    }

    getInputOffset(input: HTMLInputElement) : DOMRect {
        const body = document.body;
        const win = document.defaultView;
        const docElem = document.documentElement;
        const box = document.createElement('div');
        box.style.paddingLeft = box.style.width = "1px";
        body.appendChild(box);
        var isBoxModel = box.offsetWidth == 2;
        body.removeChild(box);
        const rect = input.getBoundingClientRect();
        const clientTop = docElem.clientTop || body.clientTop || 0;
        const clientLeft = docElem.clientLeft || body.clientLeft || 0;
        const scrollTop = win.pageYOffset || isBoxModel && docElem.scrollTop || body.scrollTop;
        const scrollLeft = win.pageXOffset || isBoxModel && docElem.scrollLeft || body.scrollLeft;
        return this.offset(rect, scrollLeft - clientLeft ,scrollTop - clientTop);
    }
}