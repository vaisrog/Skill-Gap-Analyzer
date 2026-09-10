from datetime import datetime
from database import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')  # 'student' or 'admin'
    qualification = db.Column(db.String(100), nullable=True)
    graduation_year = db.Column(db.Integer, nullable=True)
    # Phase 2 additions
    career_interest = db.Column(db.String(150), nullable=True)
    target_career_id = db.Column(db.Integer, db.ForeignKey('career_roles.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    roadmaps = db.relationship('Roadmap', backref='student', lazy=True, cascade="all, delete-orphan")
    student_skills = db.relationship('StudentSkill', backref='student', lazy=True, cascade="all, delete-orphan")
    target_career = db.relationship('CareerRole', foreign_keys=[target_career_id], backref='interested_students')

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'role': self.role,
            'qualification': self.qualification,
            'graduation_year': self.graduation_year,
            'career_interest': self.career_interest,
            'target_career_id': self.target_career_id,
            'target_career_title': self.target_career.title if self.target_career else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Skill(db.Model):
    __tablename__ = 'skills'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    role_skills = db.relationship('RoleSkill', backref='skill', lazy=True, cascade="all, delete-orphan")
    learning_resources = db.relationship('LearningResource', backref='skill', lazy=True, cascade="all, delete-orphan")
    student_skills = db.relationship('StudentSkill', backref='skill', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CareerRole(db.Model):
    __tablename__ = 'career_roles'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(80), nullable=True, index=True)
    icon = db.Column(db.String(50), nullable=True, default='Briefcase')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    role_skills = db.relationship('RoleSkill', backref='career_role', lazy=True, cascade="all, delete-orphan")
    roadmaps = db.relationship('Roadmap', backref='career_role', lazy=True)

    def to_dict(self, include_skills=True):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'icon': self.icon,
            'skills_count': len(self.role_skills),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_skills:
            data['required_skills'] = [rs.to_dict() for rs in self.role_skills]
        return data


class RoleSkill(db.Model):
    __tablename__ = 'role_skills'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    role_id = db.Column(db.Integer, db.ForeignKey('career_roles.id', ondelete='CASCADE'), nullable=False, index=True)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id', ondelete='CASCADE'), nullable=False, index=True)
    required_proficiency = db.Column(db.Integer, nullable=False, default=3)  # 0 to 5
    is_core = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'role_id': self.role_id,
            'skill_id': self.skill_id,
            'skill_name': self.skill.name if self.skill else None,
            'skill_category': self.skill.category if self.skill else None,
            'skill_description': self.skill.description if self.skill else None,
            'required_proficiency': self.required_proficiency,
            'is_core': self.is_core
        }


class StudentSkill(db.Model):
    """Stores a student's self-assessed proficiency for a given skill."""
    __tablename__ = 'student_skills'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id', ondelete='CASCADE'), nullable=False, index=True)
    proficiency = db.Column(db.Integer, nullable=False, default=0)  # 0-5
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('student_id', 'skill_id', name='uq_student_skill'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'skill_id': self.skill_id,
            'skill_name': self.skill.name if self.skill else None,
            'skill_category': self.skill.category if self.skill else None,
            'skill_description': self.skill.description if self.skill else None,
            'proficiency': self.proficiency,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class LearningResource(db.Model):
    __tablename__ = 'learning_resources'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    resource_type = db.Column(db.String(50), nullable=False, default='Course')
    difficulty_level = db.Column(db.String(20), nullable=False, default='Beginner')
    platform = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'skill_id': self.skill_id,
            'skill_name': self.skill.name if self.skill else None,
            'title': self.title,
            'url': self.url,
            'resource_type': self.resource_type,
            'difficulty_level': self.difficulty_level,
            'platform': self.platform,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Roadmap(db.Model):
    __tablename__ = 'roadmaps'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    career_role_id = db.Column(db.Integer, db.ForeignKey('career_roles.id', ondelete='SET NULL'), nullable=True, index=True)
    title = db.Column(db.String(150), nullable=False)
    status = db.Column(db.String(30), nullable=False, default='Active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship('RoadmapItem', backref='roadmap', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'career_role_id': self.career_role_id,
            'career_role_title': self.career_role.title if self.career_role else None,
            'title': self.title,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'items_count': len(self.items)
        }


class RoadmapItem(db.Model):
    __tablename__ = 'roadmap_items'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    roadmap_id = db.Column(db.Integer, db.ForeignKey('roadmaps.id', ondelete='CASCADE'), nullable=False, index=True)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id', ondelete='CASCADE'), nullable=False, index=True)
    target_proficiency = db.Column(db.Integer, nullable=False, default=3)
    status = db.Column(db.String(30), nullable=False, default='Not Started')
    sequence_order = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'roadmap_id': self.roadmap_id,
            'skill_id': self.skill_id,
            'skill_name': self.skill.name if self.skill else None,
            'target_proficiency': self.target_proficiency,
            'status': self.status,
            'sequence_order': self.sequence_order
        }
