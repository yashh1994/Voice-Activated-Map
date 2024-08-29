from flask import Flask 
import os
from dotenv import load_dotenv 


app = Flask(__name__)
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


@app.route('/ask-query/<qry>')
def askQuery(qry):
    if int(qry) in range(len(ask_response)):
        return ask_response[int(qry)]
    else:
        return 'Invalid Query'

@app.route('/all-res')
def all_responses():
    print(ask_response)
    return ask_response



if __name__ == '__main__':
    app.run(debug=True,port=os.getenv('PORT'))
    print(f"Running on http://localhost:{os.getenv('PORT')}/")

