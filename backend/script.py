from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello World!'

@app.route('/setname/<name>')
def setname(n):
    global name
    name = name
    return 'Hello World!'



if __name__ == '__main__':
    app.run(debug=True)

