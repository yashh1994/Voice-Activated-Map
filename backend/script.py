from flask import Flask
from model import process_command
from model import yash

app = Flask(__name__)

@app.route('/')
def hello_yash():
    return 'Hello there'

@app.route('/command/<command>')
def pro_com(command):
    return process_command(command)

if __name__ == '__main__':
    app.run(debug=True, port=8080)
