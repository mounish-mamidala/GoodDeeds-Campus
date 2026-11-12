from datetime import date, time
from flask import Blueprint, request, jsonify, session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from extensions import db
from models import User, Opportunity, Registration

opportunities_bp = Blueprint("opportunities", __name__)

def current_user():
    uid = session.get("user_id")
    return User.query.get(uid) if uid else None

def is_admin():
    user = current_user()
    return bool(user and user.role == "ADMIN")

def parse_opportunity(data, item=None):
    required = ["title", "description", "category", "location", "event_date"]
    for key in required:
        value = data.get(key, getattr(item, key, "") if item else "")
        if not str(value or "").strip():
            raise ValueError(f"{key.replace('_', ' ').title()} is required.")
    target = item or Opportunity()
    target.title = str(data.get("title", target.title if item else "")).strip()
    target.description = str(data.get("description", target.description if item else "")).strip()
    target.category = str(data.get("category", target.category if item else "")).strip()
    target.location = str(data.get("location", target.location if item else "")).strip()
    target.event_date = date.fromisoformat(str(data.get("event_date", target.event_date if item else "")))
    raw_time = data.get("start_time", target.start_time.strftime("%H:%M") if item and target.start_time else None)
    target.start_time = time.fromisoformat(raw_time) if raw_time else None
    target.duration_hours = float(data.get("duration_hours", target.duration_hours if item else 2))
    target.available_slots = int(data.get("available_slots", target.available_slots if item else 10))
    target.organizer = str(data.get("organizer", target.organizer if item else "GoodDeeds Campus")).strip()
    target.image_url = data.get("image_url", target.image_url if item else None)
    if target.duration_hours <= 0 or target.available_slots < 0:
        raise ValueError("Duration must be positive and slots cannot be negative.")
    return target

@opportunities_bp.get("")
def list_opportunities():
    query = Opportunity.query
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Opportunity.title.ilike(like), Opportunity.description.ilike(like), Opportunity.location.ilike(like)))
    if category and category.lower() != "all":
        query = query.filter(Opportunity.category == category)
    items = query.order_by(Opportunity.event_date.asc()).all()
    return jsonify(opportunities=[o.to_dict(False) for o in items])

@opportunities_bp.get("/<int:opportunity_id>")
def get_opportunity(opportunity_id):
    item = Opportunity.query.get_or_404(opportunity_id)
    return jsonify(opportunity=item.to_dict())

@opportunities_bp.post("")
def create_opportunity():
    if not is_admin():
        return jsonify(error="Admin access required."), 403
    try:
        item = parse_opportunity(request.get_json(silent=True) or {})
        db.session.add(item)
        db.session.commit()
        return jsonify(opportunity=item.to_dict()), 201
    except (ValueError, TypeError) as exc:
        db.session.rollback()
        return jsonify(error=str(exc)), 400

@opportunities_bp.put("/<int:opportunity_id>")
def update_opportunity(opportunity_id):
    if not is_admin():
        return jsonify(error="Admin access required."), 403
    item = Opportunity.query.get_or_404(opportunity_id)
    try:
        parse_opportunity(request.get_json(silent=True) or {}, item)
        db.session.commit()
        return jsonify(opportunity=item.to_dict())
    except (ValueError, TypeError) as exc:
        db.session.rollback()
        return jsonify(error=str(exc)), 400

@opportunities_bp.delete("/<int:opportunity_id>")
def delete_opportunity(opportunity_id):
    if not is_admin():
        return jsonify(error="Admin access required."), 403
    item = Opportunity.query.get_or_404(opportunity_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify(message="Opportunity deleted.")

@opportunities_bp.post("/<int:opportunity_id>/join")
def join_opportunity(opportunity_id):
    user = current_user()
    if not user:
        return jsonify(error="Please log in to join an opportunity."), 401
    item = Opportunity.query.get_or_404(opportunity_id)
    existing = Registration.query.filter_by(user_id=user.id, opportunity_id=item.id).first()
    if existing and existing.status != "CANCELLED":
        return jsonify(error="You have already joined this opportunity."), 409
    active_count = Registration.query.filter(
        Registration.opportunity_id == item.id,
        Registration.status != "CANCELLED"
    ).count()
    if active_count >= item.available_slots:
        return jsonify(error="Sorry, no volunteer slots are available."), 409
    if existing:
        existing.status = "JOINED"
        existing.hours_awarded = 0
    else:
        db.session.add(Registration(user_id=user.id, opportunity_id=item.id))
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(error="You have already joined this opportunity."), 409
    return jsonify(message="You joined the opportunity successfully.")
