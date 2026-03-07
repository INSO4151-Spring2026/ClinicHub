from app import create_app, db

app = create_app("development")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # Creates tables if they don't exist yet
        app.logger.info("Starting ClinicHUB Flask server...")
    app.run()