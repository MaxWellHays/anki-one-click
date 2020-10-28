from markupsafe import escape
from flask import Flask, request
app = Flask(__name__)

@app.route('/v1/translate', methods=['POST'])
def translate():
    requestContent = request.get_json(force=True)
    contentText = requestContent["contextText"]
    selectionStartOffset = requestContent["selectionStartOffset"]
    selectionLength = requestContent["selectionLength"]
    selectedText = contentText[selectionStartOffset:selectionStartOffset + selectionLength]
    return {
        "selectedText": selectedText
    }