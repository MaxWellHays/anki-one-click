interface SelectionEx extends Selection {
    modify(alter: string, direction: string, granularity: string): void;
}

export class SelectionHelper {

    constructor() {
        this.extractContext = this.extractContext.bind(this);
        this.saveSelection = this.saveSelection.bind(this);
        this.restoreSelection = this.restoreSelection.bind(this);
    }

    rangeToRestore?: Range;

    extractContext(selection : Selection) : string {
        const selEx = selection as SelectionEx;
        this.saveSelection(selEx);

        selEx.modify("move", "left", "sentence");
        selEx.modify("extend", "right", "sentence");

        const res = selEx.toString();

        this.restoreSelection(selEx);

        return res;
    }

    saveSelection(selEx : SelectionEx) : void {
        const activeElement = document.activeElement;
        const tagName = activeElement.tagName?.toLowerCase();

        if (tagName) {
            const selectionInsideInputField = tagName == "textarea" || tagName == "input";
            if (selectionInsideInputField) {
                throw "Input elements are not supported yet";
            }
            else {
                this.rangeToRestore = selEx.getRangeAt(0).cloneRange();
            }
        }
    }

    restoreSelection(selEx : SelectionEx) : void {
        selEx.removeAllRanges();
        selEx.addRange(this.rangeToRestore)
    }
}