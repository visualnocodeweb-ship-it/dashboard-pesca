from flask import Flask, jsonify, request

app = Flask(__name__)

# This route will catch any path sent to it and return debug information.
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def debug_catch_all(path):
    return jsonify({
        "message": "DEBUGGING VERCEL PATHS",
        "path_variable_received": path,
        "full_request_path": request.path,
        "request_url": request.url,
        "headers": {key: value for key, value in request.headers}
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
