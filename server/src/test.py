import spacy

nlp = spacy.load('en')

doc = nlp(u"Apples and oranges are similar. Boots and hippos aren't.")

selectionStartOffset = 11
selectionLength = 7

for token in doc:
    tokenStart = token.idx
    tokenLen = len(token.text)
    if selectionStartOffset <= tokenStart and tokenStart + tokenLen <= selectionStartOffset + selectionLength:
        print(token, token.lemma_)