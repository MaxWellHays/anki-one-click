import { DeckId } from "./ankiConnectApi";

export class ExtensionOptions {
    yandexDictionaryApiKey?: string;
    targetDeck?: DeckId;
    availableDecks: DeckId[];
}