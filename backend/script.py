from flask import Flask
from model import process_command
from dotenv import load_dotenv
import os
from flask_cors import CORS
from pathlib import Path
# Load environment variables from the parent directory
env_path = Path('..') / '.env'
load_dotenv(dotenv_path=env_path)

# Now you can access your environment variables
app = Flask(__name__)

CORS(app)

@app.route('/')
def hello_yash():
    return 'Hello there'

@app.route('/command/<command>')
def pro_com(command):
    return process_command(command)

if __name__ == '__main__':
    app.run(debug=True, port=os.getenv('PORT', 5000))
