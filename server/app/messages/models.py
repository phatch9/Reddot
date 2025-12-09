from app import db
from datetime import datetime


class Messages(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    seen = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())

    def as_dict(self):
        return {
            "message_id": self.id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "content": self.content,
            "seen": self.seen,
            "created_at": self.created_at,
        }

    @classmethod
    def get_inbox(cls, user_id):
        # Return latest message per conversation partner (simplified)
        msgs = (
            cls.query.filter((cls.receiver_id == user_id) | (cls.sender_id == user_id))
            .order_by(cls.created_at.desc())
            .all()
        )
        return [m.as_dict() for m in msgs]