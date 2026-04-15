import sys
import os
from flask import Flask
from flask_cors import CORS

# --- SET UP THE BRIDGE TO BACKEND ---
# This allows us to import the 'db' and 'models' from the other folder
current_dir = os.path.dirname(os.path.abspath(__file__))
# Moves up: src -> clinic-hub -> ClinicHub, then down into 'backend'
backend_path = os.path.abspath(os.path.join(current_dir, '..', '..', 'backend'))

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# ---  BACKEND IMPORTS ---
# Now that the bridge is built, we can safely import these
from app import db
from app.models.appointment import Appointment
from routes.routes import api_bp

app = Flask(__name__)
app.url_map.strict_slashes = False
CORS(app)

# --- 3. DATABASE & SECURITY CONFIGURATION ---
instance_dir = os.path.join(backend_path, 'instance')
db_path = os.path.join(instance_dir, 'clinic.db')

# Ensure the instance directory exists so SQLite doesn't crash
if not os.path.exists(instance_dir):
    os.makedirs(instance_dir)
    print(f"Created missing directory: {instance_dir}")

# Uses the absolute path for the SQLite URI
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config["SECRET_KEY"] = "your_shared_secret_key" 

# ---  INITIALIZE DATABASE ---
db.init_app(app)

# --- REGISTER ROUTES ---
# app.register_blueprint(api_bp)
app.register_blueprint(api_bp, url_prefix='/api')

# --- START SERVER ---
if __name__ == "__main__":
    print(f"--- ClinicHub Backend Link Active ---")
    print(f"Database Location: {db_path}")
    print("\n--- DETECTED FLASK ROUTES ---")
    for rule in app.url_map.iter_rules():
        print(f"Path: {rule.rule} | Methods: {rule.methods} | Endpoint: {rule.endpoint}")
    print("----------------------------\n")
    # Create tables automatically if they don't exist
    with app.app_context():
        # This creates the .db file and tables based on your models
        db.create_all()
        print("Database tables verified/created.")

    # Port 5002 is what your Node.js routes.js is looking for
    app.run(port=5002, debug=True)