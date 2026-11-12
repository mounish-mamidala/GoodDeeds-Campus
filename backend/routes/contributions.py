from flask import Blueprint, jsonify, session, request
from extensions import db
from models import User, Registration

contributions_bp = Blueprint("contributions", __name__)

@contributions_bp.get("/me")
def my_contributions():
    uid = session.get("user_id")
    user = User.query.get(uid) if uid else None
    if not user:
        return jsonify(error="Please log in first."), 401
    records = Registration.query.filter_by(user_id=user.id).order_by(Registration.joined_at.desc()).all()
    hours = sum(float(r.hours_awarded) for r in records if r.status == "COMPLETED")
    return jsonify(
        contributions=[r.to_dict() for r in records],
        stats={
            "joined": sum(1 for r in records if r.status in ("JOINED", "APPROVED")),
            "completed": sum(1 for r in records if r.status == "COMPLETED"),
            "hours": hours
        }
    )

@contributions_bp.get("")
def all_contributions():
    uid = session.get("user_id")
    admin = User.query.get(uid) if uid else None
    if not admin or admin.role != "ADMIN":
        return jsonify(error="Admin access required."), 403
    records = Registration.query.order_by(Registration.joined_at.desc()).all()
    return jsonify(registrations=[{
        **r.to_dict(), "student": {"id": r.user.id, "name": r.user.name, "email": r.user.email}
    } for r in records])

@contributions_bp.patch("/<int:registration_id>/status")
def update_registration_status(registration_id):
    uid = session.get("user_id")
    admin = User.query.get(uid) if uid else None
    if not admin or admin.role != "ADMIN":
        return jsonify(error="Admin access required."), 403
    record = Registration.query.get_or_404(registration_id)
    data = request.get_json(silent=True) or {}
    status = str(data.get("status", "")).upper()
    if status not in ("JOINED", "APPROVED", "COMPLETED", "CANCELLED"):
        return jsonify(error="Invalid status."), 400
    try:
        hours = float(data.get("hours_awarded", record.hours_awarded))
        if hours < 0:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify(error="Hours must be zero or positive."), 400
    record.status = status
    record.hours_awarded = hours if status == "COMPLETED" else 0
    db.session.commit()
    return jsonify(message="Registration updated.")
