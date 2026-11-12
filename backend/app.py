import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import db
from routes.auth import auth_bp
from routes.opportunities import opportunities_bp
from routes.contributions import contributions_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    origins = [x.strip() for x in os.getenv(
        "FRONTEND_ORIGINS", "http://127.0.0.1:5500,http://localhost:5500"
    ).split(",") if x.strip()]
    CORS(app, origins=origins, supports_credentials=True)
    db.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(opportunities_bp, url_prefix="/api/opportunities")
    app.register_blueprint(contributions_bp, url_prefix="/api/contributions")

    @app.get("/api/health")
    def health():
        return jsonify(status="ok", service="GoodDeeds Campus API")

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify(error="Resource not found."), 404

    @app.errorhandler(500)
    def server_error(_error):
        db.session.rollback()
        return jsonify(error="Unexpected server error."), 500

    with app.app_context():
        db.create_all()
    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
