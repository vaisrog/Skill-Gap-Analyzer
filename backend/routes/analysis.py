from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import SQLAlchemyError

from models import User
from services.analysis import build_skill_gap_analysis

analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/analysis')


@analysis_bp.route('', methods=['GET'])
@jwt_required()
def get_my_analysis():
    """Calculate an analysis for only the authenticated student's current data."""
    try:
        user = User.query.get(int(get_jwt_identity()))
        if not user:
            return jsonify({'error': 'User not found.'}), 404
        if user.role != 'student':
            return jsonify({'error': 'Only students can access skill-gap analysis.'}), 403

        analysis, error_code = build_skill_gap_analysis(user)
        if error_code == 'no_target_career':
            return jsonify({
                'error': 'Select a target career to analyze your skill gap.',
                'code': error_code,
            }), 409
        if error_code == 'no_career_requirements':
            return jsonify({
                'error': 'The selected career has no skill requirements configured yet.',
                'code': error_code,
            }), 409
        return jsonify({'analysis': analysis}), 200
    except (ValueError, TypeError):
        return jsonify({'error': 'Unable to verify the current user.'}), 401
    except SQLAlchemyError as error:
        print(f'[ANALYSIS ERROR] Database query failed: {error}')
        return jsonify({'error': 'Analysis is temporarily unavailable. Please try again.'}), 500
