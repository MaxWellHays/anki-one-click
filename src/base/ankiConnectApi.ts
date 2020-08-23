export class AnkiConnectApi {
    async getAvailableDecks(): Promise<DeckId[]> {
        var result = await this.invoke("deckNamesAndIds", 6);
        var desks : DeckId[] = [];
        Object.keys(result).forEach(key => {
            desks.push({
                name: key,
                id: result[key]
            })
        });
        return desks;
    }

    invoke(action, version, params = {}) : Promise<any> {
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

export interface DeckId {
    name: string;
    id: number;
}