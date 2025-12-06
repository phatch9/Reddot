from app import db
from flask import jsonify


class Role(db.Model):
    __tablename__: str = "roles"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, nullable=False)
    slug = db.Column(db.Text, unique=True, nullable=False)
    user_role = db.relationship("UserRole", back_populates="role")


class UserRole(db.Model):
    __tablename__ = "user_roles"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False, primary_key=True)
    subpost_id = db.Column(db.Integer, db.ForeignKey("subposts.id"))
    user = db.relationship("User", back_populates="user_role")
    role = db.relationship("Role", back_populates="user_role")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    subpost = db.relationship("SubPost", back_populates="user_role")

    def __init__(self, user_id: int, subpost_id: int, role_id: int) -> None:
        self.user_id = user_id
        self.subpost_id = subpost_id
        self.role_id = role_id

    @classmethod
    def add_moderator(cls, user_id, subpost_id):
        check_mod = UserRole.query.filter_by(user_id=user_id, subpost_id=subpost_id, role_id=1).first()
        if check_mod:
            return jsonify({"message": "Mod already exists"}), 400
        new_mod = UserRole(user_id=user_id, subpost_id=subpost_id, role_id=1)
        db.session.add(new_mod)
        db.session.commit()

    def as_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "role_id": self.role_id,
            "subpost_id": self.subpost_id,
        }