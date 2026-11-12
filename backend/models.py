from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("STUDENT", "ADMIN"), nullable=False, default="STUDENT")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    registrations = db.relationship("Registration", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}


class Opportunity(db.Model):
    __tablename__ = "opportunities"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(80), nullable=False)
    location = db.Column(db.String(160), nullable=False)
    event_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=True)
    duration_hours = db.Column(db.Numeric(5, 2), nullable=False, default=2)
    available_slots = db.Column(db.Integer, nullable=False, default=10)
    organizer = db.Column(db.String(120), nullable=False, default="GoodDeeds Campus")
    image_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    registrations = db.relationship("Registration", back_populates="opportunity", cascade="all, delete-orphan")

    def to_dict(self, include_description=True):
        joined = sum(1 for r in self.registrations if r.status != "CANCELLED")
        data = {
            "id": self.id, "title": self.title, "category": self.category,
            "location": self.location, "event_date": self.event_date.isoformat(),
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "duration_hours": float(self.duration_hours),
            "available_slots": self.available_slots, "organizer": self.organizer,
            "image_url": self.image_url, "joined_count": joined
        }
        if include_description:
            data["description"] = self.description
        return data


class Registration(db.Model):
    __tablename__ = "registrations"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    opportunity_id = db.Column(db.Integer, db.ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    status = db.Column(db.Enum("JOINED", "APPROVED", "COMPLETED", "CANCELLED"), nullable=False, default="JOINED")
    hours_awarded = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    user = db.relationship("User", back_populates="registrations")
    opportunity = db.relationship("Opportunity", back_populates="registrations")
    __table_args__ = (db.UniqueConstraint("user_id", "opportunity_id", name="uq_user_opportunity"),)

    def to_dict(self):
        return {
            "id": self.id, "status": self.status,
            "hours_awarded": float(self.hours_awarded),
            "joined_at": self.joined_at.isoformat(),
            "opportunity": self.opportunity.to_dict()
        }
