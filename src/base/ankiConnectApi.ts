export interface NewNoteInfo {
    deckName: string;
    modelName: string;
    fields: UpdateFields;
    tags: string[];
    options?: NewNoteOptions;
}

export interface NewNoteOptions {
    allowDuplicate: boolean;
    duplicateScope: string;
}

export interface UpdateFields {
    Front: string;
    Back: string;
}

export interface Fields {
    Front: FieldInfo;
    Back: FieldInfo;
}

export interface NoteInfo {
    noteId: number;
    tags: string[];
    fields: Fields;
    modelName: string;
    cards: number[];
}

export interface FieldInfo {
    value: string;
    order: number;
}

export interface UpdateNoteInfo {
    id:     number;
    fields: UpdateFields;
}

export interface DeckId {
    name: string;
    id: number;
}

export class AnkiConnectApi {
    async getAvailableDecks(): Promise<DeckId[]> {
        var result = await this.invoke("deckNamesAndIds", 6);
        var desks: DeckId[] = [];
        Object.keys(result).forEach(key => {
            desks.push({
                name: key,
                id: result[key]
            })
        });
        return desks;
    }

    async getNoteInfoOfWord(currentDeck: string, word: string): Promise<NoteInfo[]> {
        const params: any = {
            query: `\"deck:${currentDeck}\" \"${word.trim()}\"`
        }
        const notesIds = await this.invoke("findNotes", 6, params) as string[];

        if (notesIds.length == 0) {
            return [];
        }

        const notesInfo = await this.invoke("notesInfo", 6, {
            notes: notesIds
        }) as NoteInfo[];

        return notesInfo;
    }

    async getExistingTranslationOfWord(currentDeck: string, word: string): Promise<string[]> {
        const noteInfos = await this.getNoteInfoOfWord(currentDeck, word);
        var translations: string[] = [];
        for (let noteInfo of noteInfos) {
            const frontText = noteInfo.fields.Front.value.replace(/\[.*?\]/g, "").trim()
            if (frontText.toLowerCase() != word.toLowerCase()) {
                continue;
            }

            const backText = noteInfo.fields.Back.value;
            const backWords = backText.split(",").map(w => w.trim());
            backWords.forEach(w => translations.push(w));
        }
        return Array.from(new Set(translations));
    }

    async setTranslationsOfWord(currentDeck: string, word: string, newTranslations: string[]): Promise<string[]> {
        const noteInfos = await this.getNoteInfoOfWord(currentDeck, word);
        let existingNote: NoteInfo = null;
        for (let noteInfo of noteInfos) {
            const frontText = noteInfo.fields.Front.value.replace(/\[.*?\]/g, "").trim()
            if (frontText.toLowerCase() != word.toLowerCase()) {
                continue;
            }

            existingNote = noteInfo;
            break;
        }

        const joinedTranslation = newTranslations.map(w => w.trim().toLowerCase()).join(", ");

        let response = null;
        if (existingNote != null) {
            existingNote.fields.Back.value = joinedTranslation;
            const noteToUpdate : UpdateNoteInfo = {
                id: existingNote.noteId,
                fields: {
                    Front: word,
                    Back: joinedTranslation
                }
            }
            response = await this.invoke("updateNoteFields", 6, {
                note: noteToUpdate
            });
        }
        else {
            const newNote: NewNoteInfo = {
                deckName: currentDeck,
                modelName: "Basic",
                tags: ["anki-one-click"],
                fields: {
                    Front: word,
                    Back: joinedTranslation,
                },
                options: {
                    allowDuplicate: false,
                    duplicateScope: "deck"
                }
            }
            response = await this.invoke("addNote", 6, {
                note: newNote
            });
        }

        return newTranslations;
    }

    invoke(action, version, params = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('error', () => reject('failed to issue request'));
            xhr.addEventListener('load', () => {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (Object.getOwnPropertyNames(response).length != 2) {
                        throw 'response has an unexpected number of fields';
                    }
                    if (!response.hasOwnProperty('error')) {
                        throw 'response is missing required error field';
                    }
                    if (!response.hasOwnProperty('result')) {
                        throw 'response is missing required result field';
                    }
                    if (response.error) {
                        throw response.error;
                    }
                    resolve(response.result);
                } catch (e) {
                    reject(e);
                }
            });

            xhr.open('POST', 'http://127.0.0.1:8765');
            xhr.send(JSON.stringify({ action, version, params }));
        });
    }
}