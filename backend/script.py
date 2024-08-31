from flask import Flask, jsonify
import os
from dotenv import load_dotenv
from flask_cors import CORS

app = Flask(__name__)

# Specify the origins, methods, and headers
CORS(app, resources={r"/*": {"origins": "*"}}, methods=['GET', 'POST'], allow_headers=["Content-Type"])

load_dotenv()

name = 'Default'

ask_response = [
    {'action': 'find_distance', 'message': "Calculating distance between 'Rajkot' and 'Junagadh'.", 'details': {'place1': 'Rajkot', 'place2': 'Junagadh'}, 'zoom': None},
    {'action': 'find_location', 'message': "The desired location, 'NewYork', is somewhere here.", 'details': {'location': 'NewYork'}, 'zoom': None},
    {'action': 'distance_from_current', 'message': "Calculating distance from current location to 'Rajkot'.", 'details': {'place1': 'current location', 'place2': 'Rajkot'}, 'zoom': None},
    {'action': 'read_details', 'message': "Fetching details about 'Mumbai'.", 'details': {'location': 'Mumbai'}, 'zoom': None},
    {'action': 'zoom', 'message': "Zooming in on location 'Junagadh'.", 'details': {'location': 'Junagadh', 'zoom': 'in'}, 'zoom': None}
]

@app.route('/')
def hello():
    return 'Hello World!'

@app.route('/setname/<n>')
def setname(n):
    global name
    name = n
    return 'Setting the Name to ' + name

@app.route('/getname')
def getName():
    global name
    return name

@app.route('/ask-query/<qry>', methods=['POST'])
def askQuery(qry):
    if int(qry) in range(len(ask_response)):
        return jsonify({"response": ask_response[int(qry)]})
    else:
        return jsonify({"error": "Invalid Query"}), 400

@app.route('/all-res')
def all_responses():
    print(ask_response)
    return jsonify(ask_response)

if __name__ == '__main__':
    port = os.getenv('PORT') or 5000
    app.run(debug=True, port=port)
    print(f"Running on http://localhost:{port}/")
