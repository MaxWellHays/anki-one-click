export interface YandexTranslateResponse {
    def:  Def[];
}

export interface Def {
    text: string;
    pos:  string;
    ts:   string;
    tr:   Tr[];
}

export interface Tr {
    text: string;
    pos:  string;
    gen?: string;
    mean: Mean[];
    ex?:  Ex[];
    syn?: Syn[];
    asp?: string;
}

export interface Ex {
    text: string;
    tr:   Mean[];
}

export interface Mean {
    text: string;
}

export interface Syn {
    text: string;
    pos:  string;
    gen?: string;
    asp?: string;
}

export class YandexDictionaryClient {
    translate(yandexDictionaryApiKey: string, textToTranslate: string) : Promise<YandexTranslateResponse> {
        return new Promise(resolve => {
            var url = new URL('https://dictionary.yandex.net/api/v1/dicservice.json/lookup');
            url.searchParams.set('key', yandexDictionaryApiKey);
            url.searchParams.set('lang', 'en-ru');
            url.searchParams.set('text', textToTranslate);
            var requestOptions = {
                method: 'GET',
                redirect: 'follow'
            } as RequestInit;

            fetch(url.href, requestOptions)
                .then(response => response.json())
                .then(response => resolve(response));
        })
    }
}