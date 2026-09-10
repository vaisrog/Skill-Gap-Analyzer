import os
from app import create_app
from database import db, bcrypt
from models import User, Skill, CareerRole, RoleSkill, LearningResource

def seed_database():
    app = create_app()
    with app.app_context():
        print("Creating database tables...")
        db.create_all()

        # 1. Seed Default Admin User
        admin_email = "admin@skillgap.com"
        admin_user = User.query.filter_by(email=admin_email).first()
        if not admin_user:
            admin_user = User(
                full_name="System Administrator",
                email=admin_email,
                password_hash=bcrypt.generate_password_hash("Admin@12345").decode('utf-8'),
                role="admin",
                qualification="M.Tech Computer Science",
                graduation_year=2020
            )
            db.session.add(admin_user)
            print("Seeded Admin account: admin@skillgap.com / Admin@12345")

        # 2. Seed Default Student User
        student_email = "student@skillgap.com"
        student_user = User.query.filter_by(email=student_email).first()
        if not student_user:
            student_user = User(
                full_name="Alex Johnson",
                email=student_email,
                password_hash=bcrypt.generate_password_hash("Student@12345").decode('utf-8'),
                role="student",
                qualification="B.Tech Computer Science",
                graduation_year=2026
            )
            db.session.add(student_user)
            print("Seeded Student account: student@skillgap.com / Student@12345")

        db.session.commit()

        # 3. Seed Skills
        skills_data = [
            # Programming & CS Core
            {"name": "Python", "category": "Programming", "description": "High-level programming language widely used in web backend, data science, and scripting."},
            {"name": "JavaScript", "category": "Programming", "description": "Core language for web interactivity and full-stack development with Node.js."},
            {"name": "Java", "category": "Programming", "description": "Object-oriented language popular for enterprise software and Android development."},
            {"name": "C++", "category": "Programming", "description": "High-performance systems programming and algorithm optimization language."},
            {"name": "Data Structures & Algorithms", "category": "Computer Science", "description": "Core computational problem-solving principles and data organization techniques."},
            {"name": "Object-Oriented Design", "category": "Computer Science", "description": "Software architectural paradigm based on class hierarchies and design patterns."},

            # Web Development & Databases
            {"name": "SQL", "category": "Databases", "description": "Relational database query language for data manipulation and schema management."},
            {"name": "React", "category": "Web Development", "description": "Popular frontend JavaScript UI library for building component-based interfaces."},
            {"name": "Node.js", "category": "Web Development", "description": "Asynchronous event-driven JavaScript runtime environment for backend development."},
            {"name": "HTML & CSS", "category": "Web Development", "description": "Fundamental building blocks of modern web page structure and visual styling."},
            {"name": "Database Design", "category": "Databases", "description": "Principles of ER modelling, normalization, and relational schema optimization."},

            # Data Analytics & Visualization
            {"name": "Data Visualization", "category": "Data & Analytics", "description": "Techniques and tools (Tableau, PowerBI, Matplotlib) to present insights visually."},
            {"name": "Statistics & Probability", "category": "Data & Analytics", "description": "Mathematical foundations for statistical analysis, testing, and data modeling."},
            {"name": "Excel & Spreadsheet Modeling", "category": "Data & Analytics", "description": "Advanced spreadsheet functions, pivot tables, and analytical reporting."},

            # Cybersecurity
            {"name": "Network Security", "category": "Cybersecurity", "description": "Protocols, firewalls, and defense mechanisms protecting data network infrastructure."},
            {"name": "Ethical Hacking & Penetration Testing", "category": "Cybersecurity", "description": "Vulnerability scanning, exploit analysis, and security auditing techniques."},
            {"name": "Linux System Administration", "category": "Cybersecurity & Infrastructure", "description": "Command-line proficiency, user permissions, shell scripting, and server configuration."},
            {"name": "Cryptography & PKI", "category": "Cybersecurity", "description": "Encryption standards, digital certificates, and secure communication protocols."},
            {"name": "Incident Response", "category": "Cybersecurity", "description": "Methodologies for detecting, analyzing, and mitigating security breaches."},

            # Cloud & DevOps
            {"name": "AWS & Cloud Platforms", "category": "Cloud & Infrastructure", "description": "Core cloud concepts, IAM, EC2, S3, serverless computing, and cloud architecture."},
            {"name": "Docker & Containerization", "category": "DevOps", "description": "Packaging software applications into isolated container environments."},
            {"name": "Kubernetes", "category": "DevOps", "description": "Container orchestration system for automating application deployment and scaling."},
            {"name": "Git & CI/CD", "category": "DevOps", "description": "Distributed version control and automated build/test pipelines."},
            {"name": "Terraform & IaC", "category": "DevOps", "description": "Infrastructure as Code automation for cloud resource provisioning."}
            ,{"name": "Pandas", "category": "Data & Analytics", "description": "Python library for tabular data cleaning, transformation, and analysis."}
            ,{"name": "NumPy", "category": "Data & Analytics", "description": "Python library for numerical computing and array operations."}
            ,{"name": "Power BI", "category": "Data & Analytics", "description": "Business intelligence tool for interactive reporting and dashboards."}
            ,{"name": "REST APIs", "category": "Web Development", "description": "Designing and consuming HTTP APIs using REST conventions."}
            ,{"name": "Networking", "category": "Cybersecurity & Infrastructure", "description": "TCP/IP, DNS, routing, and core network troubleshooting concepts."}
            ,{"name": "SIEM", "category": "Cybersecurity", "description": "Security information and event management for monitoring and alerting."}
            ,{"name": "Security Tools", "category": "Cybersecurity", "description": "Practical use of vulnerability scanners, endpoint tools, and security utilities."}
            ,{"name": "Cloud Security", "category": "Cloud & Infrastructure", "description": "Cloud IAM, workload protection, and secure cloud architecture practices."}
            ,{"name": "Programming Fundamentals", "category": "Programming", "description": "Variables, control flow, functions, debugging, and program design basics."}
            ,{"name": "Algorithms", "category": "Computer Science", "description": "Algorithmic problem solving, complexity analysis, and common techniques."}
        ]

        skill_map = {}
        for s in skills_data:
            existing = Skill.query.filter_by(name=s["name"]).first()
            if not existing:
                existing = Skill(name=s["name"], category=s["category"], description=s["description"])
                db.session.add(existing)
                db.session.flush()
            skill_map[s["name"]] = existing

        db.session.commit()
        print(f"Seeded {len(skill_map)} technical skills.")

        # 4. Seed Career Roles & Required Skills
        career_roles_data = [
            {
                "title": "Data Analyst",
                "description": "Transforms raw data into actionable business insights using statistical models, SQL queries, and visual dashboards.",
                "category": "Data & Analytics",
                "icon": "BarChart3",
                "skills": [
                    {"name": "SQL", "level": 5, "core": True},
                    {"name": "Python", "level": 4, "core": True},
                    {"name": "Data Visualization", "level": 4, "core": True},
                    {"name": "Statistics & Probability", "level": 4, "core": True},
                    {"name": "Excel & Spreadsheet Modeling", "level": 4, "core": False},
                    {"name": "Pandas", "level": 3, "core": False},
                    {"name": "NumPy", "level": 3, "core": False},
                    {"name": "Power BI", "level": 4, "core": True}
                ]
            },
            {
                "title": "Full Stack Developer",
                "description": "Designs and develops both user-facing client applications and backend server architectures.",
                "category": "Web Development",
                "icon": "Code",
                "skills": [
                    {"name": "JavaScript", "level": 5, "core": True},
                    {"name": "React", "level": 4, "core": True},
                    {"name": "Node.js", "level": 4, "core": True},
                    {"name": "HTML & CSS", "level": 4, "core": True},
                    {"name": "Database Design", "level": 4, "core": True},
                    {"name": "SQL", "level": 3, "core": False},
                    {"name": "Git & CI/CD", "level": 3, "core": False},
                    {"name": "REST APIs", "level": 4, "core": True}
                ]
            },
            {
                "title": "Cybersecurity Analyst",
                "description": "Monitors and safeguards computer networks and information systems against cyber threats and security vulnerabilities.",
                "category": "Cybersecurity",
                "icon": "ShieldAlert",
                "skills": [
                    {"name": "Network Security", "level": 4, "core": True},
                    {"name": "Linux System Administration", "level": 4, "core": True},
                    {"name": "Incident Response", "level": 4, "core": True},
                    {"name": "Ethical Hacking & Penetration Testing", "level": 3, "core": False},
                    {"name": "Cryptography & PKI", "level": 3, "core": False},
                    {"name": "Networking", "level": 4, "core": True},
                    {"name": "SIEM", "level": 4, "core": True},
                    {"name": "Security Tools", "level": 3, "core": False}
                ]
            },
            {
                "title": "Cloud Engineer",
                "description": "Architects, deploys, and manages scalable cloud infrastructure and containerized workloads.",
                "category": "Cloud & Infrastructure",
                "icon": "Cloud",
                "skills": [
                    {"name": "AWS & Cloud Platforms", "level": 4, "core": True},
                    {"name": "Docker & Containerization", "level": 4, "core": True},
                    {"name": "Linux System Administration", "level": 4, "core": True},
                    {"name": "Kubernetes", "level": 3, "core": True},
                    {"name": "Git & CI/CD", "level": 3, "core": False},
                    {"name": "Terraform & IaC", "level": 3, "core": False},
                    {"name": "Networking", "level": 4, "core": True},
                    {"name": "Python", "level": 3, "core": False},
                    {"name": "Cloud Security", "level": 3, "core": False}
                ]
            },
            {
                "title": "Software Developer",
                "description": "Builds robust, scalable software applications and system tools following computer science engineering fundamentals.",
                "category": "Software Engineering",
                "icon": "Terminal",
                "skills": [
                    {"name": "Data Structures & Algorithms", "level": 5, "core": True},
                    {"name": "Python", "level": 4, "core": True},
                    {"name": "Object-Oriented Design", "level": 4, "core": True},
                    {"name": "Git & CI/CD", "level": 4, "core": True},
                    {"name": "SQL", "level": 3, "core": False},
                    {"name": "Programming Fundamentals", "level": 4, "core": True},
                    {"name": "Algorithms", "level": 4, "core": True},
                    {"name": "Java", "level": 3, "core": False}
                ]
            }
        ]

        for cr in career_roles_data:
            role_obj = CareerRole.query.filter_by(title=cr["title"]).first()
            if not role_obj:
                role_obj = CareerRole(
                    title=cr["title"],
                    description=cr["description"],
                    category=cr["category"],
                    icon=cr["icon"]
                )
                db.session.add(role_obj)
                db.session.flush()
            else:
                role_obj.description = cr["description"]
                role_obj.category = cr["category"]
                role_obj.icon = cr["icon"]

            for sk in cr["skills"]:
                skill_obj = skill_map.get(sk["name"])
                if not skill_obj:
                    continue
                rs = RoleSkill.query.filter_by(role_id=role_obj.id, skill_id=skill_obj.id).first()
                if rs:
                    rs.required_proficiency = sk["level"]
                    rs.is_core = sk["core"]
                else:
                    db.session.add(RoleSkill(
                        role_id=role_obj.id,
                        skill_id=skill_obj.id,
                        required_proficiency=sk["level"],
                        is_core=sk["core"]
                    ))

        db.session.commit()
        print(f"Seeded {len(career_roles_data)} career roles with required skills.")

        # 5. Seed Initial Learning Resources
        resources_data = [
            {"skill_name": "Python", "title": "Complete Python Bootcamp 2026", "url": "https://www.coursera.org", "resource_type": "Course", "difficulty_level": "Beginner", "platform": "Coursera"},
            {"skill_name": "SQL", "title": "Interactive SQL Tutorial & Queries", "url": "https://www.mode.com/sql-tutorial", "resource_type": "Documentation", "difficulty_level": "Beginner", "platform": "Mode Analytics"},
            {"skill_name": "React", "title": "Official React Docs & Interactive Guide", "url": "https://react.dev", "resource_type": "Documentation", "difficulty_level": "Intermediate", "platform": "React Org"},
            {"skill_name": "JavaScript", "title": "Modern JavaScript from Beginning to Master", "url": "https://developer.mozilla.org", "resource_type": "Documentation", "difficulty_level": "Beginner", "platform": "MDN Web Docs"},
            {"skill_name": "Data Structures & Algorithms", "title": "Mastering Algorithms & Data Structures", "url": "https://www.geeksforgeeks.org", "resource_type": "Course", "difficulty_level": "Intermediate", "platform": "GeeksforGeeks"},
            {"skill_name": "AWS & Cloud Platforms", "title": "AWS Certified Cloud Practitioner Essentials", "url": "https://aws.amazon.com/training/", "resource_type": "Course", "difficulty_level": "Beginner", "platform": "AWS Skill Builder"}
        ]

        for res in resources_data:
            skill_obj = skill_map.get(res["skill_name"])
            if skill_obj:
                existing_res = LearningResource.query.filter_by(title=res["title"]).first()
                if not existing_res:
                    lr = LearningResource(
                        skill_id=skill_obj.id,
                        title=res["title"],
                        url=res["url"],
                        resource_type=res["resource_type"],
                        difficulty_level=res["difficulty_level"],
                        platform=res["platform"]
                    )
                    db.session.add(lr)

        db.session.commit()
        print("Seeded learning resources successfully.")
        print("Database initialization & seeding complete!")

if __name__ == '__main__':
    seed_database()
