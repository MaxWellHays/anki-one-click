import { DeckId } from "./ankiConnectApi";

export enum TriggerKey {
    None = 0,
    Ctrl = 1,
    Alt = 2,
    Shilf = 4,
}

export interface ExtensionOptions {
    yandexDictionaryApiKey?: string;
    targetDeck?: DeckId;
    availableDecks: DeckId[];
    popupOnDoubleClick: boolean;
    popupOnDoubleClickTriggerKey: TriggerKey;
    popupOnSelect: boolean;
    popupOnSelectTriggerKey: TriggerKey;
}