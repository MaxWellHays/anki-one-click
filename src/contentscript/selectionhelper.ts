interface SelectionEx extends Selection {
    modify(alter: string, direction: string, granularity: string): void;
}

export interface SelectionInfo {
    text: string;
    rect: DOMRect;
    context: string;
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
            rect = this.getTextBoundingRect(inputElement, inputElement.selectionStart, inputElement.selectionEnd, true);
        }

        return {
            context: this.extractContext(selection),
            rect: this.offset(rect, window.pageXOffset, window.pageYOffset),
            text: selectionText
        }
    }

    offset(rect: DOMRect, xOffset: number, yOffset: number): DOMRect {
        return new DOMRect(rect.x + xOffset, rect.y + yOffset, rect.width, rect.height);
    }

    isSourceLanguageText(text: string): boolean {
        return (/^[a-zA-Z ]+$/.test(text));
    }

    extractContext(selection: Selection): string {
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

        const res = selEx.toString();

        if (toRestore.type == "simple") {
            selEx.removeAllRanges();
            selEx.addRange(toRestore.range);
        }
        else {
            const inputElement = activeElement as HTMLInputElement;
            inputElement.setSelectionRange(toRestore.selectionStart, toRestore.selectionEnd);
        }

        return res;
    }

    isInputFieldElement(element: Element): boolean {
        const tagName = element.tagName?.toLowerCase();
        return tagName === "textarea"
            || tagName === "input" && (element as HTMLInputElement).type === "text";
    }

    // https://stackoverflow.com/a/7948715/3029359
    getTextBoundingRect(input: HTMLInputElement, selectionStart: number, selectionEnd: number, debug: boolean) {
        const offset = getInputOffset();
        let topPos = offset.top;
        let leftPos: any = offset.left;
        const width = getInputCSS('width', true);
        const height = getInputCSS('height', true);

        // Styles to simulate a node in an input field
        var cssDefaultStyles = "white-space:pre;padding:0;margin:0;",
            listOfModifiers = ['direction', 'font-family', 'font-size', 'font-size-adjust', 'font-variant', 'font-weight', 'font-style', 'letter-spacing', 'line-height', 'text-align', 'text-indent', 'text-transform', 'word-wrap', 'word-spacing'];

        topPos += getInputCSS('padding-top', true);
        topPos += getInputCSS('border-top-width', true);
        leftPos += getInputCSS('padding-left', true);
        leftPos += getInputCSS('border-left-width', true);
        leftPos += 1; //Seems to be necessary

        for (var i = 0; i < listOfModifiers.length; i++) {
            var property = listOfModifiers[i];
            cssDefaultStyles += property + ':' + getInputCSS(property, false) + ';';
        }
        // End of CSS variable checks

        var text = input.value,
            textLen = text.length,
            fakeClone = document.createElement("div");
        if (selectionStart > 0) appendPart(0, selectionStart);
        var fakeRange = appendPart(selectionStart, selectionEnd);
        if (textLen > selectionEnd) appendPart(selectionEnd, textLen);

        // Styles to inherit the font styles of the element
        fakeClone.style.cssText = cssDefaultStyles;

        // Styles to position the text node at the desired position
        fakeClone.style.position = "absolute";
        fakeClone.style.top = topPos + "px";
        fakeClone.style.left = leftPos + "px";
        fakeClone.style.width = width + "px";
        fakeClone.style.height = height + "px";
        document.body.appendChild(fakeClone);
        var returnValue = fakeRange.getBoundingClientRect(); //Get rect

        if (!debug) fakeClone.parentNode.removeChild(fakeClone); //Remove temp
        return returnValue;

        // Local functions for readability of the previous code
        function appendPart(start, end) {
            var span = document.createElement("span");
            span.style.cssText = cssDefaultStyles; //Force styles to prevent unexpected results
            span.textContent = text.substring(start, end);
            fakeClone.appendChild(span);
            return span;
        }
        // Computing offset position
        function getInputOffset() {
            var body = document.body,
                win = document.defaultView,
                docElem = document.documentElement,
                box: any = document.createElement('div');
            box.style.paddingLeft = box.style.width = "1px";
            body.appendChild(box);
            var isBoxModel = box.offsetWidth == 2;
            body.removeChild(box);
            box = input.getBoundingClientRect();
            var clientTop = docElem.clientTop || body.clientTop || 0,
                clientLeft = docElem.clientLeft || body.clientLeft || 0,
                scrollTop = win.pageYOffset || isBoxModel && docElem.scrollTop || body.scrollTop,
                scrollLeft = win.pageXOffset || isBoxModel && docElem.scrollLeft || body.scrollLeft;
            return {
                top: box.top + scrollTop - clientTop,
                left: box.left + scrollLeft - clientLeft
            };
        }

        function getInputCSS(prop, isnumber: true) : number;
        function getInputCSS(prop, isnumber: false) : string;
        function getInputCSS(prop, isnumber) : string | number {
            var val = document.defaultView.getComputedStyle(input, null).getPropertyValue(prop);
            return isnumber ? parseFloat(val) : val;
        }
    }
}