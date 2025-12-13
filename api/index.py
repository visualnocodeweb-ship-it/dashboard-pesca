from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({"message": "Hello from API!"})
