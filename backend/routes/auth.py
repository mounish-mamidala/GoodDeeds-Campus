from flask import Blueprint, request, session, jsonify
from sqlalchemy.exc import IntegrityError
from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if not name or len(name) > 100:
        return jsonify(error="Name is required (maximum 100 characters)."), 400
    if "@" not in email or len(email) > 150:
        return jsonify(error="Enter a valid email address."), 400
    if len(password) < 8:
        return jsonify(error="Password must contain at least 8 characters."), 400
    user = User(name=name, email=email, role="STUDENT")
    user.set_password(password)
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(error="An account with this email already exists."), 409
    session.clear()
    session["user_id"] = user.id
    return jsonify(message="Account created.", user=user.to_dict()), 201

@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify(error="Invalid email or password."), 401
    session.clear()
    session["user_id"] = user.id
    return jsonify(message="Login successful.", user=user.to_dict())

@auth_bp.post("/logout")
def logout():
    session.clear()
    return jsonify(message="Logged out.")

@auth_bp.get("/me")
def me():
    uid = session.get("user_id")
    user = User.query.get(uid) if uid else None
    return jsonify(user=user.to_dict() if user else None)
