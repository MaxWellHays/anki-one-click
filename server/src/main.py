from markupsafe import escape
from flask import Flask, request
import spacy
app = Flask(__name__)

@app.route("/")
def home():
    return "Hello, Flask!"

@app.route('/v1/translate', methods=['POST'])
def translate():
    requestContent = request.get_json(force=True)
    contentText = requestContent["contextText"]
    selectionStartOffset = requestContent["selectionStartOffset"]
    selectionLength = requestContent["selectionLength"]
    selectedText = contentText[selectionStartOffset:selectionStartOffset + selectionLength]
    nlp = spacy.load("en")
    doc = nlp(contentText)
    for token in doc:
        tokenStart = token.idx
        tokenLen = len(token.text)
        if selectionStartOffset <= tokenStart and tokenStart + tokenLen <= selectionStartOffset + selectionLength:
            return {
                "selectedText": token.lemma_
            }
    return {
        "selectedText": selectedText
    }