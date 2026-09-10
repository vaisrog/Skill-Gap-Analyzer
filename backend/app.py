import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config, SQLALCHEMY_DATABASE_URI
from database import db, bcrypt, jwt
from routes.auth import auth_bp
from routes.careers import careers_bp
from routes.skills import skills_bp
from routes.resources import resources_bp
from routes.users import users_bp
from routes.student_skills import student_skills_bp
from routes.analysis import analysis_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI

    CORS(app, resources={r"/*": {"origins": "*"}},
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(careers_bp)
    app.register_blueprint(skills_bp)
    app.register_blueprint(resources_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(student_skills_bp)   # Phase 2
    app.register_blueprint(analysis_bp)

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'app': 'Skill Gap Analyzer & Learning Roadmap API',
            'version': '1.0.0-phase3',
            'db_uri_type': 'mysql' if 'mysql' in app.config['SQLALCHEMY_DATABASE_URI'] else 'sqlite'
        }), 200

    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({'error': 'Missing authorization token.'}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({'error': 'Invalid token signature.'}), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({'error': 'Authorization token has expired. Please login again.'}), 401

    return app


if __name__ == '__main__':
    app = create_app()

    with app.app_context():
        try:
            db.create_all()
            from models import User
            if not User.query.first():
                from seed import seed_database
                seed_database()
        except Exception as e:
            print(f"Database setup note: {e}")

    port = int(os.getenv('PORT', 5000))
    print(f"Starting Skill Gap Analyzer Backend API on http://127.0.0.1:{port}")
    debug = os.getenv('FLASK_DEBUG', '').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
