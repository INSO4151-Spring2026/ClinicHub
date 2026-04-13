from flask import Flask
from flask_cors import CORS
from routes.routes import api_bp

app = Flask(__name__)
CORS(app)

# Configuration
app.config["SECRET_KEY"] = "your_shared_secret_key" # Match Node's JWT_SECRET

# Register the routes
app.register_blueprint(api_bp, url_prefix='/api')

if __name__ == "__main__":
    # Ensure port 5002 matches what Node is looking for
    app.run(port=5002, debug=True)