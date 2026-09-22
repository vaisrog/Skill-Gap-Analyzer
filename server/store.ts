import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export interface User {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'student' | 'admin';
  qualification: string | null;
  graduation_year: number | null;
  career_interest: string | null;
  target_career_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  description: string;
  created_at: string;
}

export interface CareerRole {
  id: number;
  title: string;
  description: string;
  category: string | null;
  icon: string;
  created_at: string;
}

export interface RoleSkill {
  id: number;
  role_id: number;
  skill_id: number;
  required_proficiency: number;
  is_core: boolean;
  importance?: 'Critical' | 'Important' | 'Optional';
  created_at: string;
}

export interface JobAnalysisSkill {
  id: number;
  analysis_id: number;
  skill_id: number;
  skill_name: string;
  skill_category: string;
  required_proficiency: number;
  student_proficiency: number;
  skill_gap: number;
  status: 'Match' | 'Minor Gap' | 'Moderate Gap' | 'Major Gap' | 'Missing';
  is_core: boolean;
  importance: 'Critical' | 'Important' | 'Optional';
  is_estimated: boolean;
  recommendation_reason?: string;
}

export interface JobAnalysis {
  id: number;
  student_id: number;
  job_title: string;
  company: string;
  job_description: string;
  match_score: number;
  readiness_classification: 'Highly Ready' | 'Developing' | 'Needs Improvement' | 'Beginner';
  identified_skills_count: number;
  skills_satisfied_count: number;
  skills_gap_count: number;
  missing_skills_count: number;
  major_gaps_count: number;
  created_at: string;
  skills: JobAnalysisSkill[];
  recommended_next_skills: Array<{
    skill_name: string;
    importance: string;
    gap: number;
    reason: string;
  }>;
}

export interface StudentSkill {
  id: number;
  student_id: number;
  skill_id: number;
  proficiency: number;
  created_at: string;
  updated_at: string;
}

export interface LearningResource {
  id: number;
  skill_id: number;
  title: string;
  url: string;
  resource_type: string;
  difficulty_level: string;
  platform: string | null;
  created_at: string;
}

export interface SkillPrerequisite {
  id: number;
  skill_id: number; // The target skill that requires a prerequisite
  prerequisite_skill_id: number; // The foundational skill that should be learned first
}

export interface Roadmap {
  id: number;
  student_id: number;
  career_id: number;
  title: string;
  target_career_title: string;
  total_items: number;
  completed_items: number;
  overall_completion: number; // 0 - 100
  created_at: string;
  updated_at: string;
}

export interface RoadmapItem {
  id: number;
  roadmap_id: number;
  student_id: number;
  sequence: number; // 1, 2, 3...
  skill_id: number;
  skill_name: string;
  skill_category: string;
  topic: string;
  description: string;
  why_needed: string;
  current_proficiency: number;
  required_proficiency: number;
  skill_gap: number;
  importance: 'Critical' | 'Important' | 'Optional';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  difficulty: string;
  estimated_duration: string;
  prerequisites: string[]; // List of prerequisite skill names
  learning_resource: {
    id: number;
    title: string;
    url: string;
    resource_type: string;
    difficulty_level: string;
    platform: string | null;
  } | null;
  status: 'Not Started' | 'In Progress' | 'Completed';
  completion_percentage: number; // 0 - 100
  created_at: string;
  updated_at: string;
}

// Phase 6 Interfaces
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'roadmap' | 'skill' | 'job' | 'resume' | 'career';
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: string;
  unlocked_at: string;
}

export interface ActivityEvent {
  id: number;
  user_id: number;
  type:
    | 'roadmap_completed'
    | 'roadmap_progress'
    | 'achievement_unlocked'
    | 'job_analyzed'
    | 'resume_analyzed'
    | 'skill_updated'
    | 'career_changed'
    | 'career_selected';
  title: string;
  description: string;
  timestamp: string;
}

export interface ProgressSnapshot {
  id: number;
  user_id: number;
  timestamp: string;
  readiness_percentage: number;
  skills_logged: number;
  roadmap_completion: number;
  target_career_title?: string;
  trigger_event: string;
}

export interface ResumeSkillMatch {
  skill_id: number;
  skill_name: string;
  skill_category: string;
  in_profile: boolean;
  current_proficiency: number;
  in_resume: boolean;
  frequency_in_resume: number;
  context?: string;
}

export interface ResumeAnalysisRecord {
  id: number;
  user_id: number;
  filename: string;
  filesize: number;
  created_at: string;
  raw_text_length: number;
  parsed_skills: ResumeSkillMatch[];
  skills_in_resume_not_in_profile: ResumeSkillMatch[];
  skills_in_profile_not_in_resume: ResumeSkillMatch[];
  education_mentions: string[];
  certifications_mentions: string[];
  tools_mentions: string[];
}

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', name: 'First Step', description: 'Completed your first roadmap milestone', icon: 'Compass', category: 'roadmap' },
  { id: 'skill_builder', name: 'Skill Builder', description: 'Completed 5 roadmap milestone items', icon: 'Layers', category: 'roadmap' },
  { id: 'roadmap_explorer', name: 'Roadmap Explorer', description: 'Reached 25% roadmap completion', icon: 'Map', category: 'roadmap' },
  { id: 'halfway_there', name: 'Halfway There', description: 'Reached 50% roadmap completion', icon: 'Flame', category: 'roadmap' },
  { id: 'almost_ready', name: 'Almost Ready', description: 'Reached 75% roadmap completion', icon: 'TrendingUp', category: 'roadmap' },
  { id: 'career_ready', name: 'Career Ready', description: 'Completed 100% of required roadmap skills', icon: 'Award', category: 'roadmap' },
  { id: 'skill_starter', name: 'Skill Starter', description: 'Logged at least 3 skills in your profile', icon: 'BookOpen', category: 'skill' },
  { id: 'skill_master', name: 'Skill Master', description: 'Achieved Level 5 (Expert) in any skill', icon: 'Zap', category: 'skill' },
  { id: 'career_decider', name: 'Career Decider', description: 'Selected your target career role', icon: 'Target', category: 'career' },
  { id: 'job_explorer', name: 'Job Explorer', description: 'Completed your first Job Description Analysis', icon: 'FileSearch', category: 'job' },
  { id: 'resume_ready', name: 'Resume Ready', description: 'Completed your first Resume / CV Analysis', icon: 'FileText', category: 'resume' },
];

class Store {
  users: User[] = [];
  skills: Skill[] = [];
  careerRoles: CareerRole[] = [];
  roleSkills: RoleSkill[] = [];
  studentSkills: StudentSkill[] = [];
  learningResources: LearningResource[] = [];
  skillPrerequisites: SkillPrerequisite[] = [];
  roadmaps: Roadmap[] = [];
  roadmapItems: RoadmapItem[] = [];
  jobAnalyses: JobAnalysis[] = [];
  userAchievements: UserAchievement[] = [];
  activityEvents: ActivityEvent[] = [];
  progressSnapshots: ProgressSnapshot[] = [];
  resumeAnalyses: ResumeAnalysisRecord[] = [];

  private nextUserId = 1;
  private nextSkillId = 1;
  private nextCareerId = 1;
  private nextRoleSkillId = 1;
  private nextStudentSkillId = 1;
  private nextResourceId = 1;
  private nextPrerequisiteId = 1;
  private nextRoadmapId = 1;
  private nextRoadmapItemId = 1;
  private nextJobAnalysisId = 1;
  private nextJobAnalysisSkillId = 1;
  private nextUserAchievementId = 1;
  private nextActivityEventId = 1;
  private nextProgressSnapshotId = 1;
  private nextResumeAnalysisId = 1;

  private dataFilePath = path.join(process.cwd(), 'data', 'store.json');

  constructor() {
    const loaded = this.load();
    if (!loaded) {
      this.seed();
      this.save();
    }
    this.ensureDefaultUsers();
  }

  save(): void {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        users: this.users,
        skills: this.skills,
        careerRoles: this.careerRoles,
        roleSkills: this.roleSkills,
        studentSkills: this.studentSkills,
        learningResources: this.learningResources,
        skillPrerequisites: this.skillPrerequisites,
        roadmaps: this.roadmaps,
        roadmapItems: this.roadmapItems,
        jobAnalyses: this.jobAnalyses,
        userAchievements: this.userAchievements,
        activityEvents: this.activityEvents,
        progressSnapshots: this.progressSnapshots,
        resumeAnalyses: this.resumeAnalyses,
        nextUserId: this.nextUserId,
        nextSkillId: this.nextSkillId,
        nextCareerId: this.nextCareerId,
        nextRoleSkillId: this.nextRoleSkillId,
        nextStudentSkillId: this.nextStudentSkillId,
        nextResourceId: this.nextResourceId,
        nextPrerequisiteId: this.nextPrerequisiteId,
        nextRoadmapId: this.nextRoadmapId,
        nextRoadmapItemId: this.nextRoadmapItemId,
        nextJobAnalysisId: this.nextJobAnalysisId,
        nextJobAnalysisSkillId: this.nextJobAnalysisSkillId,
        nextUserAchievementId: this.nextUserAchievementId,
        nextActivityEventId: this.nextActivityEventId,
        nextProgressSnapshotId: this.nextProgressSnapshotId,
        nextResumeAnalysisId: this.nextResumeAnalysisId,
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not save store to file:', e);
    }
  }

  load(): boolean {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.users) && Array.isArray(data.skills) && Array.isArray(data.careerRoles)) {
          this.users = data.users;
          this.skills = data.skills;
          this.careerRoles = data.careerRoles;
          this.roleSkills = data.roleSkills || [];
          this.studentSkills = data.studentSkills || [];
          this.learningResources = data.learningResources || [];
          this.skillPrerequisites = data.skillPrerequisites || [];
          this.roadmaps = data.roadmaps || [];
          this.roadmapItems = data.roadmapItems || [];
          this.jobAnalyses = data.jobAnalyses || [];
          this.userAchievements = data.userAchievements || [];
          this.activityEvents = data.activityEvents || [];
          this.progressSnapshots = data.progressSnapshots || [];
          this.resumeAnalyses = data.resumeAnalyses || [];
          this.nextUserId = data.nextUserId || (Math.max(...this.users.map((u: any) => u.id), 0) + 1);
          this.nextSkillId = data.nextSkillId || (Math.max(...this.skills.map((s: any) => s.id), 0) + 1);
          this.nextCareerId = data.nextCareerId || (Math.max(...this.careerRoles.map((c: any) => c.id), 0) + 1);
          this.nextRoleSkillId = data.nextRoleSkillId || (Math.max(...this.roleSkills.map((r: any) => r.id), 0) + 1);
          this.nextStudentSkillId = data.nextStudentSkillId || (Math.max(...this.studentSkills.map((s: any) => s.id), 0) + 1);
          this.nextResourceId = data.nextResourceId || (Math.max(...this.learningResources.map((l: any) => l.id), 0) + 1);
          this.nextPrerequisiteId = data.nextPrerequisiteId || (Math.max(...this.skillPrerequisites.map((p: any) => p.id), 0) + 1);
          this.nextRoadmapId = data.nextRoadmapId || (Math.max(...this.roadmaps.map((r: any) => r.id), 0) + 1);
          this.nextRoadmapItemId = data.nextRoadmapItemId || (Math.max(...this.roadmapItems.map((i: any) => i.id), 0) + 1);
          this.nextJobAnalysisId = data.nextJobAnalysisId || (Math.max(...this.jobAnalyses.map((j: any) => j.id), 0) + 1);
          this.nextJobAnalysisSkillId = data.nextJobAnalysisSkillId || 1;
          this.nextUserAchievementId = data.nextUserAchievementId || (Math.max(...this.userAchievements.map((a: any) => a.id), 0) + 1);
          this.nextActivityEventId = data.nextActivityEventId || (Math.max(...this.activityEvents.map((e: any) => e.id), 0) + 1);
          this.nextProgressSnapshotId = data.nextProgressSnapshotId || (Math.max(...this.progressSnapshots.map((p: any) => p.id), 0) + 1);
          this.nextResumeAnalysisId = data.nextResumeAnalysisId || (Math.max(...this.resumeAnalyses.map((r: any) => r.id), 0) + 1);
          return true;
        }
      }
    } catch (e) {
      console.warn('Could not load store from file:', e);
    }
    return false;
  }

  private ensureDefaultUsers(): void {
    const studentHash = bcrypt.hashSync('Student@12345', 10);
    const adminHash = bcrypt.hashSync('Admin@12345', 10);
    const now = new Date().toISOString();

    if (!this.users.some((u) => u.email.toLowerCase() === 'admin@skillgap.com')) {
      this.users.push({
        id: this.nextUserId++,
        full_name: 'System Administrator',
        email: 'admin@skillgap.com',
        password_hash: adminHash,
        role: 'admin',
        qualification: 'M.Tech Computer Science',
        graduation_year: 2020,
        career_interest: null,
        target_career_id: null,
        created_at: now,
        updated_at: now,
      });
    }

    if (!this.users.some((u) => u.email.toLowerCase() === 'student@skillgap.com')) {
      this.users.push({
        id: this.nextUserId++,
        full_name: 'Alex Johnson',
        email: 'student@skillgap.com',
        password_hash: studentHash,
        role: 'student',
        qualification: 'B.Tech Computer Science',
        graduation_year: 2026,
        career_interest: null,
        target_career_id: 1,
        created_at: now,
        updated_at: now,
      });
    }

    // Also support user's email if provided in environment
    if (!this.users.some((u) => u.email.toLowerCase() === 'vaisnav2006@gmail.com')) {
      this.users.push({
        id: this.nextUserId++,
        full_name: 'Vaisnav',
        email: 'vaisnav2006@gmail.com',
        password_hash: studentHash,
        role: 'student',
        qualification: 'B.Tech Computer Science',
        graduation_year: 2026,
        career_interest: 'AI Systems Engineer',
        target_career_id: 1,
        created_at: now,
        updated_at: now,
      });
    }

    this.save();
  }

  private seed() {
    const now = new Date().toISOString();

    // 1. Seed Users
    const adminHash = bcrypt.hashSync('Admin@12345', 10);
    const studentHash = bcrypt.hashSync('Student@12345', 10);

    this.users.push({
      id: this.nextUserId++,
      full_name: 'System Administrator',
      email: 'admin@skillgap.com',
      password_hash: adminHash,
      role: 'admin',
      qualification: 'M.Tech Computer Science',
      graduation_year: 2020,
      career_interest: null,
      target_career_id: null,
      created_at: now,
      updated_at: now,
    });

    this.users.push({
      id: this.nextUserId++,
      full_name: 'Alex Johnson',
      email: 'student@skillgap.com',
      password_hash: studentHash,
      role: 'student',
      qualification: 'B.Tech Computer Science',
      graduation_year: 2026,
      career_interest: null,
      target_career_id: null,
      created_at: now,
      updated_at: now,
    });

    // 2. Seed Skills
    const skillsData = [
      { name: 'Python', category: 'Programming', description: 'High-level programming language widely used in web backend, data science, and scripting.' },
      { name: 'JavaScript', category: 'Programming', description: 'Core language for web interactivity and full-stack development with Node.js.' },
      { name: 'Java', category: 'Programming', description: 'Object-oriented language popular for enterprise software and Android development.' },
      { name: 'C++', category: 'Programming', description: 'High-performance systems programming and algorithm optimization language.' },
      { name: 'Data Structures & Algorithms', category: 'Computer Science', description: 'Core computational problem-solving principles and data organization techniques.' },
      { name: 'Object-Oriented Design', category: 'Computer Science', description: 'Software architectural paradigm based on class hierarchies and design patterns.' },
      { name: 'SQL', category: 'Databases', description: 'Relational database query language for data manipulation and schema management.' },
      { name: 'React', category: 'Web Development', description: 'Popular frontend JavaScript UI library for building component-based interfaces.' },
      { name: 'Node.js', category: 'Web Development', description: 'Asynchronous event-driven JavaScript runtime environment for backend development.' },
      { name: 'HTML & CSS', category: 'Web Development', description: 'Fundamental building blocks of modern web page structure and visual styling.' },
      { name: 'Database Design', category: 'Databases', description: 'Principles of ER modelling, normalization, and relational schema optimization.' },
      { name: 'Data Visualization', category: 'Data & Analytics', description: 'Techniques and tools (Tableau, PowerBI, Matplotlib) to present insights visually.' },
      { name: 'Statistics & Probability', category: 'Data & Analytics', description: 'Mathematical foundations for statistical analysis, testing, and data modeling.' },
      { name: 'Excel & Spreadsheet Modeling', category: 'Data & Analytics', description: 'Advanced spreadsheet functions, pivot tables, and analytical reporting.' },
      { name: 'Network Security', category: 'Cybersecurity', description: 'Protocols, firewalls, and defense mechanisms protecting data network infrastructure.' },
      { name: 'Ethical Hacking & Penetration Testing', category: 'Cybersecurity', description: 'Vulnerability scanning, exploit analysis, and security auditing techniques.' },
      { name: 'Linux System Administration', category: 'Cybersecurity & Infrastructure', description: 'Command-line proficiency, user permissions, shell scripting, and server configuration.' },
      { name: 'Cryptography & PKI', category: 'Cybersecurity', description: 'Encryption standards, digital certificates, and secure communication protocols.' },
      { name: 'Incident Response', category: 'Cybersecurity', description: 'Methodologies for detecting, analyzing, and mitigating security breaches.' },
      { name: 'AWS & Cloud Platforms', category: 'Cloud & Infrastructure', description: 'Core cloud concepts, IAM, EC2, S3, serverless computing, and cloud architecture.' },
      { name: 'Docker & Containerization', category: 'DevOps', description: 'Packaging software applications into isolated container environments.' },
      { name: 'Kubernetes', category: 'DevOps', description: 'Container orchestration system for automating application deployment and scaling.' },
      { name: 'Git & CI/CD', category: 'DevOps', description: 'Distributed version control and automated build/test pipelines.' },
      { name: 'Terraform & IaC', category: 'DevOps', description: 'Infrastructure as Code automation for cloud resource provisioning.' },
      { name: 'Pandas', category: 'Data & Analytics', description: 'Python library for tabular data cleaning, transformation, and analysis.' },
      { name: 'NumPy', category: 'Data & Analytics', description: 'Python library for numerical computing and array operations.' },
      { name: 'Power BI', category: 'Data & Analytics', description: 'Business intelligence tool for interactive reporting and dashboards.' },
      { name: 'REST APIs', category: 'Web Development', description: 'Designing and consuming HTTP APIs using REST conventions.' },
      { name: 'Networking', category: 'Cybersecurity & Infrastructure', description: 'TCP/IP, DNS, routing, and core network troubleshooting concepts.' },
      { name: 'SIEM', category: 'Cybersecurity', description: 'Security information and event management for monitoring and alerting.' },
      { name: 'Security Tools', category: 'Cybersecurity', description: 'Practical use of vulnerability scanners, endpoint tools, and security utilities.' },
      { name: 'Cloud Security', category: 'Cloud & Infrastructure', description: 'Cloud IAM, workload protection, and secure cloud architecture practices.' },
      { name: 'Programming Fundamentals', category: 'Programming', description: 'Variables, control flow, functions, debugging, and program design basics.' },
      { name: 'Algorithms', category: 'Computer Science', description: 'Algorithmic problem solving, complexity analysis, and common techniques.' },
    ];

    const skillMap = new Map<string, Skill>();
    for (const item of skillsData) {
      const skill: Skill = {
        id: this.nextSkillId++,
        name: item.name,
        category: item.category,
        description: item.description,
        created_at: now,
      };
      this.skills.push(skill);
      skillMap.set(skill.name, skill);
    }

    // 3. Seed Career Roles
    const careersData = [
      {
        title: 'Data Analyst',
        description: 'Transforms raw data into actionable business insights using statistical models, SQL queries, and visual dashboards.',
        category: 'Data & Analytics',
        icon: 'BarChart3',
        skills: [
          { name: 'SQL', level: 5, core: true },
          { name: 'Python', level: 4, core: true },
          { name: 'Data Visualization', level: 4, core: true },
          { name: 'Statistics & Probability', level: 4, core: true },
          { name: 'Excel & Spreadsheet Modeling', level: 4, core: false },
          { name: 'Pandas', level: 3, core: false },
          { name: 'NumPy', level: 3, core: false },
          { name: 'Power BI', level: 4, core: true },
        ],
      },
      {
        title: 'Full Stack Developer',
        description: 'Designs and develops both user-facing client applications and backend server architectures.',
        category: 'Web Development',
        icon: 'Code',
        skills: [
          { name: 'JavaScript', level: 5, core: true },
          { name: 'React', level: 4, core: true },
          { name: 'Node.js', level: 4, core: true },
          { name: 'HTML & CSS', level: 4, core: true },
          { name: 'Database Design', level: 4, core: true },
          { name: 'SQL', level: 3, core: false },
          { name: 'Git & CI/CD', level: 3, core: false },
          { name: 'REST APIs', level: 4, core: true },
        ],
      },
      {
        title: 'Cybersecurity Analyst',
        description: 'Monitors and safeguards computer networks and information systems against cyber threats and security vulnerabilities.',
        category: 'Cybersecurity',
        icon: 'ShieldAlert',
        skills: [
          { name: 'Network Security', level: 4, core: true },
          { name: 'Linux System Administration', level: 4, core: true },
          { name: 'Incident Response', level: 4, core: true },
          { name: 'Ethical Hacking & Penetration Testing', level: 3, core: false },
          { name: 'Cryptography & PKI', level: 3, core: false },
          { name: 'Networking', level: 4, core: true },
          { name: 'SIEM', level: 4, core: true },
          { name: 'Security Tools', level: 3, core: false },
        ],
      },
      {
        title: 'Cloud Engineer',
        description: 'Architects, deploys, and manages scalable cloud infrastructure and containerized workloads.',
        category: 'Cloud & Infrastructure',
        icon: 'Cloud',
        skills: [
          { name: 'AWS & Cloud Platforms', level: 4, core: true },
          { name: 'Docker & Containerization', level: 4, core: true },
          { name: 'Linux System Administration', level: 4, core: true },
          { name: 'Kubernetes', level: 3, core: true },
          { name: 'Git & CI/CD', level: 3, core: false },
          { name: 'Terraform & IaC', level: 3, core: false },
          { name: 'Networking', level: 4, core: true },
          { name: 'Python', level: 3, core: false },
          { name: 'Cloud Security', level: 3, core: false },
        ],
      },
      {
        title: 'Software Developer',
        description: 'Builds robust, scalable software applications and system tools following computer science engineering fundamentals.',
        category: 'Software Engineering',
        icon: 'Terminal',
        skills: [
          { name: 'Data Structures & Algorithms', level: 5, core: true },
          { name: 'Python', level: 4, core: true },
          { name: 'Object-Oriented Design', level: 4, core: true },
          { name: 'Git & CI/CD', level: 4, core: true },
          { name: 'SQL', level: 3, core: false },
          { name: 'Programming Fundamentals', level: 4, core: true },
          { name: 'Algorithms', level: 4, core: true },
          { name: 'Java', level: 3, core: false },
        ],
      },
    ];

    for (const cData of careersData) {
      const roleId = this.nextCareerId++;
      const career: CareerRole = {
        id: roleId,
        title: cData.title,
        description: cData.description,
        category: cData.category,
        icon: cData.icon,
        created_at: now,
      };
      this.careerRoles.push(career);

      for (const req of cData.skills) {
        const skill = skillMap.get(req.name);
        if (skill) {
          this.roleSkills.push({
            id: this.nextRoleSkillId++,
            role_id: roleId,
            skill_id: skill.id,
            required_proficiency: req.level,
            is_core: req.core,
            created_at: now,
          });
        }
      }
    }

    // 4. Seed Learning Resources
    const resourcesData = [
      { skill_name: 'Python', title: 'Complete Python Bootcamp 2026', url: 'https://www.coursera.org', resource_type: 'Course', difficulty_level: 'Beginner', platform: 'Coursera' },
      { skill_name: 'SQL', title: 'Interactive SQL Tutorial & Queries', url: 'https://www.mode.com/sql-tutorial', resource_type: 'Documentation', difficulty_level: 'Beginner', platform: 'Mode Analytics' },
      { skill_name: 'React', title: 'Official React Docs & Interactive Guide', url: 'https://react.dev', resource_type: 'Documentation', difficulty_level: 'Intermediate', platform: 'React Org' },
      { skill_name: 'JavaScript', title: 'Modern JavaScript from Beginning to Master', url: 'https://developer.mozilla.org', resource_type: 'Documentation', difficulty_level: 'Beginner', platform: 'MDN Web Docs' },
      { skill_name: 'Data Structures & Algorithms', title: 'Mastering Algorithms & Data Structures', url: 'https://www.geeksforgeeks.org', resource_type: 'Course', difficulty_level: 'Intermediate', platform: 'GeeksforGeeks' },
      { skill_name: 'AWS & Cloud Platforms', title: 'AWS Certified Cloud Practitioner Essentials', url: 'https://aws.amazon.com/training/', resource_type: 'Course', difficulty_level: 'Beginner', platform: 'AWS Skill Builder' },
      { skill_name: 'HTML & CSS', title: 'Responsive Web Design & Modern CSS', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML', resource_type: 'Documentation', difficulty_level: 'Beginner', platform: 'MDN Web Docs' },
      { skill_name: 'Node.js', title: 'Node.js Backend Architecture & Express Guides', url: 'https://nodejs.org/en/docs', resource_type: 'Documentation', difficulty_level: 'Intermediate', platform: 'Node.js Org' },
      { skill_name: 'Linux System Administration', title: 'Linux Journey: Practical Admin & Terminal Essentials', url: 'https://linuxjourney.com', resource_type: 'Course', difficulty_level: 'Beginner', platform: 'Linux Journey' },
      { skill_name: 'Docker & Containerization', title: 'Docker Getting Started Guide & Container Mastery', url: 'https://docs.docker.com/get-started/', resource_type: 'Documentation', difficulty_level: 'Beginner', platform: 'Docker Docs' },
      { skill_name: 'Git & CI/CD', title: 'Pro Git Book and Modern CI/CD Workflows', url: 'https://git-scm.com/book/en/v2', resource_type: 'Documentation', difficulty_level: 'Beginner', platform: 'Git SCM' },
      { skill_name: 'Data Visualization', title: 'Data Storytelling & Visual Dashboards', url: 'https://www.tableau.com/learn', resource_type: 'Course', difficulty_level: 'Beginner', platform: 'Tableau Learn' },
      { skill_name: 'Statistics & Probability', title: 'Introduction to Applied Probability & Statistics', url: 'https://ocw.mit.edu', resource_type: 'Course', difficulty_level: 'Intermediate', platform: 'MIT OpenCourseWare' },
      { skill_name: 'Network Security', title: 'Computer Networking and Network Security Fundamentals', url: 'https://www.coursera.org', resource_type: 'Course', difficulty_level: 'Intermediate', platform: 'Coursera' },
      { skill_name: 'Database Design', title: 'Relational Database Schema Design & Normalization', url: 'https://www.postgresqltutorial.com', resource_type: 'Documentation', difficulty_level: 'Intermediate', platform: 'PostgreSQL Tutorial' },
      { skill_name: 'Object-Oriented Design', title: 'Design Patterns: Elements of Reusable Object-Oriented Software', url: 'https://refactoring.guru/design-patterns', resource_type: 'Documentation', difficulty_level: 'Intermediate', platform: 'Refactoring Guru' },
      { skill_name: 'Kubernetes', title: 'Kubernetes Production Architecture & Pod Lifecycle', url: 'https://kubernetes.io/docs/tutorials/', resource_type: 'Documentation', difficulty_level: 'Advanced', platform: 'Kubernetes.io' },
    ];

    for (const r of resourcesData) {
      const skill = skillMap.get(r.skill_name);
      if (skill) {
        this.learningResources.push({
          id: this.nextResourceId++,
          skill_id: skill.id,
          title: r.title,
          url: r.url,
          resource_type: r.resource_type,
          difficulty_level: r.difficulty_level,
          platform: r.platform,
          created_at: now,
        });
      }
    }

    // 5. Seed Skill Prerequisites (Foundational -> Dependent)
    const prerequisitePairs: Array<{ target_skill: string; prereq_skill: string }> = [
      // Web Development
      { target_skill: 'React', prereq_skill: 'JavaScript' },
      { target_skill: 'React', prereq_skill: 'HTML & CSS' },
      { target_skill: 'Node.js', prereq_skill: 'JavaScript' },
      { target_skill: 'JavaScript', prereq_skill: 'HTML & CSS' },
      // Databases & Backend
      { target_skill: 'Database Design', prereq_skill: 'SQL' },
      // Data & Analytics
      { target_skill: 'Data Visualization', prereq_skill: 'Statistics & Probability' },
      { target_skill: 'Data Visualization', prereq_skill: 'Python' },
      { target_skill: 'Excel & Spreadsheet Modeling', prereq_skill: 'Statistics & Probability' },
      // DevOps & Cloud
      { target_skill: 'Kubernetes', prereq_skill: 'Docker & Containerization' },
      { target_skill: 'Docker & Containerization', prereq_skill: 'Linux System Administration' },
      { target_skill: 'AWS & Cloud Platforms', prereq_skill: 'Linux System Administration' },
      // Cybersecurity
      { target_skill: 'Network Security', prereq_skill: 'Linux System Administration' },
      { target_skill: 'Ethical Hacking & Penetration Testing', prereq_skill: 'Network Security' },
      { target_skill: 'Ethical Hacking & Penetration Testing', prereq_skill: 'Linux System Administration' },
      { target_skill: 'Incident Response', prereq_skill: 'Network Security' },
      // Software Engineering Core
      { target_skill: 'Object-Oriented Design', prereq_skill: 'Data Structures & Algorithms' },
      { target_skill: 'Data Structures & Algorithms', prereq_skill: 'Python' },
    ];

    for (const pair of prerequisitePairs) {
      const targetSkill = skillMap.get(pair.target_skill);
      const prereqSkill = skillMap.get(pair.prereq_skill);
      if (targetSkill && prereqSkill && targetSkill.id !== prereqSkill.id) {
        this.skillPrerequisites.push({
          id: this.nextPrerequisiteId++,
          skill_id: targetSkill.id,
          prerequisite_skill_id: prereqSkill.id,
        });
      }
    }
  }

  // User methods
  getUserById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(data: { full_name: string; email: string; password_hash: string; qualification?: string; graduation_year?: number | null; role?: 'student' | 'admin' }): User {
    const now = new Date().toISOString();
    const newUser: User = {
      id: this.nextUserId++,
      full_name: data.full_name,
      email: data.email.toLowerCase(),
      password_hash: data.password_hash,
      role: data.role || 'student',
      qualification: data.qualification || null,
      graduation_year: data.graduation_year ?? null,
      career_interest: null,
      target_career_id: null,
      created_at: now,
      updated_at: now,
    };
    this.users.push(newUser);
    this.save();
    return newUser;
  }

  userToDict(user: User) {
    const targetCareer = user.target_career_id ? this.careerRoles.find((c) => c.id === user.target_career_id) : null;
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      qualification: user.qualification,
      graduation_year: user.graduation_year,
      career_interest: user.career_interest,
      target_career_id: user.target_career_id,
      target_career_title: targetCareer ? targetCareer.title : null,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  // Skill methods
  getAllSkills(): Skill[] {
    return [...this.skills];
  }

  getResourcesBySkillId(skillId: number): LearningResource[] {
    return this.learningResources.filter((r) => r.skill_id === skillId);
  }

  getSkillById(id: number): Skill | undefined {
    return this.skills.find((s) => s.id === id);
  }

  getSkillByName(name: string): Skill | undefined {
    return this.skills.find((s) => s.name.toLowerCase() === name.toLowerCase());
  }

  createSkill(data: { name: string; category: string; description: string }): Skill {
    const skill: Skill = {
      id: this.nextSkillId++,
      name: data.name,
      category: data.category,
      description: data.description,
      created_at: new Date().toISOString(),
    };
    this.skills.push(skill);
    this.save();
    return skill;
  }

  updateSkill(id: number, data: Partial<Omit<Skill, 'id' | 'created_at'>>): Skill | null {
    const skill = this.getSkillById(id);
    if (!skill) return null;
    if (data.name !== undefined) skill.name = data.name;
    if (data.category !== undefined) skill.category = data.category;
    if (data.description !== undefined) skill.description = data.description;
    this.save();
    return skill;
  }

  deleteSkill(id: number): boolean {
    const idx = this.skills.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.skills.splice(idx, 1);
    this.roleSkills = this.roleSkills.filter((rs) => rs.skill_id !== id);
    this.studentSkills = this.studentSkills.filter((ss) => ss.skill_id !== id);
    this.learningResources = this.learningResources.filter((lr) => lr.skill_id !== id);
    this.save();
    return true;
  }

  // Career Role methods
  getCareerById(id: number): CareerRole | undefined {
    return this.careerRoles.find((c) => c.id === id);
  }

  getCareerByTitle(title: string): CareerRole | undefined {
    return this.careerRoles.find((c) => c.title.toLowerCase() === title.toLowerCase());
  }

  careerToDict(career: CareerRole, includeSkills = true) {
    const roleSkills = this.roleSkills.filter((rs) => rs.role_id === career.id);
    const data: any = {
      id: career.id,
      title: career.title,
      description: career.description,
      category: career.category,
      icon: career.icon,
      skills_count: roleSkills.length,
      created_at: career.created_at,
    };
    if (includeSkills) {
      data.required_skills = roleSkills.map((rs) => {
        const skill = this.getSkillById(rs.skill_id);
        return {
          id: rs.id,
          role_id: rs.role_id,
          skill_id: rs.skill_id,
          skill_name: skill?.name || null,
          skill_category: skill?.category || null,
          skill_description: skill?.description || null,
          required_proficiency: rs.required_proficiency,
          is_core: rs.is_core,
        };
      });
    }
    return data;
  }

  createCareer(data: { title: string; description: string; category?: string; icon?: string; skills?: Array<{ skill_id: number; required_proficiency?: number; is_core?: boolean }> }): CareerRole {
    const now = new Date().toISOString();
    const career: CareerRole = {
      id: this.nextCareerId++,
      title: data.title,
      description: data.description,
      category: data.category || null,
      icon: data.icon || 'Briefcase',
      created_at: now,
    };
    this.careerRoles.push(career);

    if (data.skills) {
      for (const item of data.skills) {
        if (item.skill_id) {
          this.roleSkills.push({
            id: this.nextRoleSkillId++,
            role_id: career.id,
            skill_id: item.skill_id,
            required_proficiency: item.required_proficiency ?? 3,
            is_core: item.is_core ?? true,
            created_at: now,
          });
        }
      }
    }
    this.save();
    return career;
  }

  updateCareer(id: number, data: { title?: string; description?: string; icon?: string }): CareerRole | null {
    const career = this.getCareerById(id);
    if (!career) return null;
    if (data.title !== undefined) career.title = data.title;
    if (data.description !== undefined) career.description = data.description;
    if (data.icon !== undefined) career.icon = data.icon;
    this.save();
    return career;
  }

  deleteCareer(id: number): boolean {
    const idx = this.careerRoles.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.careerRoles.splice(idx, 1);
    this.roleSkills = this.roleSkills.filter((rs) => rs.role_id !== id);
    for (const u of this.users) {
      if (u.target_career_id === id) {
        u.target_career_id = null;
      }
    }
    this.save();
    return true;
  }

  // Role Skill management methods (Phase 5)
  getRoleSkillsByRoleId(roleId: number): RoleSkill[] {
    return this.roleSkills.filter((rs) => rs.role_id === roleId);
  }

  getRoleSkillById(id: number): RoleSkill | undefined {
    return this.roleSkills.find((rs) => rs.id === id);
  }

  addRoleSkill(roleId: number, data: {
    skill_id: number;
    required_proficiency: number;
    is_core?: boolean;
    importance?: 'Critical' | 'Important' | 'Optional';
  }): RoleSkill {
    const now = new Date().toISOString();
    const existing = this.roleSkills.find((rs) => rs.role_id === roleId && rs.skill_id === data.skill_id);
    if (existing) {
      existing.required_proficiency = data.required_proficiency;
      if (data.is_core !== undefined) existing.is_core = data.is_core;
      if (data.importance !== undefined) {
        existing.importance = data.importance;
        existing.is_core = data.importance === 'Critical';
      }
      this.save();
      return existing;
    }

    const importance = data.importance || (data.is_core ? 'Critical' : 'Important');
    const isCore = data.is_core !== undefined ? data.is_core : importance === 'Critical';

    const newRoleSkill: RoleSkill = {
      id: this.nextRoleSkillId++,
      role_id: roleId,
      skill_id: data.skill_id,
      required_proficiency: data.required_proficiency,
      is_core: isCore,
      importance,
      created_at: now,
    };
    this.roleSkills.push(newRoleSkill);
    this.save();
    return newRoleSkill;
  }

  updateRoleSkill(id: number, data: {
    required_proficiency?: number;
    is_core?: boolean;
    importance?: 'Critical' | 'Important' | 'Optional';
  }): RoleSkill | null {
    const rs = this.getRoleSkillById(id);
    if (!rs) return null;
    if (data.required_proficiency !== undefined) rs.required_proficiency = data.required_proficiency;
    if (data.importance !== undefined) {
      rs.importance = data.importance;
      rs.is_core = data.importance === 'Critical';
    } else if (data.is_core !== undefined) {
      rs.is_core = data.is_core;
      rs.importance = data.is_core ? 'Critical' : 'Important';
    }
    this.save();
    return rs;
  }

  deleteRoleSkill(id: number): boolean {
    const idx = this.roleSkills.findIndex((rs) => rs.id === id);
    if (idx === -1) return false;
    this.roleSkills.splice(idx, 1);
    this.save();
    return true;
  }

  // Student Skills methods
  studentSkillToDict(ss: StudentSkill) {
    const skill = this.getSkillById(ss.skill_id);
    return {
      id: ss.id,
      student_id: ss.student_id,
      skill_id: ss.skill_id,
      skill_name: skill?.name || null,
      skill_category: skill?.category || null,
      skill_description: skill?.description || null,
      proficiency: ss.proficiency,
      created_at: ss.created_at,
      updated_at: ss.updated_at,
    };
  }

  getStudentSkills(studentId: number): StudentSkill[] {
    return this.studentSkills
      .filter((s) => s.student_id === studentId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  addOrUpdateStudentSkill(studentId: number, skillId: number, proficiency: number): { entry: StudentSkill; wasCreated: boolean } {
    const now = new Date().toISOString();
    const existing = this.studentSkills.find((s) => s.student_id === studentId && s.skill_id === skillId);
    if (existing) {
      existing.proficiency = proficiency;
      existing.updated_at = now;
      return { entry: existing, wasCreated: false };
    }
    const entry: StudentSkill = {
      id: this.nextStudentSkillId++,
      student_id: studentId,
      skill_id: skillId,
      proficiency,
      created_at: now,
      updated_at: now,
    };
    this.studentSkills.push(entry);
    this.save();
    return { entry, wasCreated: true };
  }

  updateStudentSkillProficiency(entryId: number, proficiency: number): StudentSkill | null {
    const entry = this.studentSkills.find((s) => s.id === entryId);
    if (!entry) return null;
    entry.proficiency = proficiency;
    entry.updated_at = new Date().toISOString();
    this.save();
    return entry;
  }

  deleteStudentSkill(entryId: number): StudentSkill | null {
    const idx = this.studentSkills.findIndex((s) => s.id === entryId);
    if (idx === -1) return null;
    const removed = this.studentSkills.splice(idx, 1)[0];
    this.save();
    return removed;
  }

  // Learning Resources methods
  resourceToDict(res: LearningResource) {
    const skill = this.getSkillById(res.skill_id);
    return {
      id: res.id,
      skill_id: res.skill_id,
      skill_name: skill?.name || null,
      title: res.title,
      url: res.url,
      resource_type: res.resource_type,
      difficulty_level: res.difficulty_level,
      platform: res.platform,
      created_at: res.created_at,
    };
  }

  getResources(skillId?: number): LearningResource[] {
    if (skillId) {
      return this.learningResources
        .filter((r) => r.skill_id === skillId)
        .sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...this.learningResources].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createResource(data: { skill_id: number; title: string; url: string; resource_type?: string; difficulty_level?: string; platform?: string }): LearningResource {
    const res: LearningResource = {
      id: this.nextResourceId++,
      skill_id: data.skill_id,
      title: data.title,
      url: data.url,
      resource_type: data.resource_type || 'Course',
      difficulty_level: data.difficulty_level || 'Beginner',
      platform: data.platform || null,
      created_at: new Date().toISOString(),
    };
    this.learningResources.push(res);
    this.save();
    return res;
  }

  updateResource(id: number, data: Partial<Omit<LearningResource, 'id' | 'created_at'>>): LearningResource | null {
    const res = this.learningResources.find((r) => r.id === id);
    if (!res) return null;
    if (data.title !== undefined) res.title = data.title;
    if (data.url !== undefined) res.url = data.url;
    if (data.resource_type !== undefined) res.resource_type = data.resource_type;
    if (data.difficulty_level !== undefined) res.difficulty_level = data.difficulty_level;
    if (data.platform !== undefined) res.platform = data.platform;
    if (data.skill_id !== undefined) res.skill_id = data.skill_id;
    return res;
  }

  deleteResource(id: number): boolean {
    const idx = this.learningResources.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.learningResources.splice(idx, 1);
    this.save();
    return true;
  }

  // ==================== Skill Prerequisite Methods ====================
  getPrerequisiteIdsForSkill(skillId: number): number[] {
    return this.skillPrerequisites
      .filter((p) => p.skill_id === skillId)
      .map((p) => p.prerequisite_skill_id);
  }

  getPrerequisitesForSkill(skillId: number): Skill[] {
    const prereqIds = this.getPrerequisiteIdsForSkill(skillId);
    return this.skills.filter((s) => prereqIds.includes(s.id));
  }

  // ==================== Roadmap Methods ====================
  getRoadmapByStudentId(studentId: number): Roadmap | undefined {
    return this.roadmaps.find((r) => r.student_id === studentId);
  }

  getRoadmapById(id: number): Roadmap | undefined {
    return this.roadmaps.find((r) => r.id === id);
  }

  getRoadmapItems(roadmapId: number): RoadmapItem[] {
    return this.roadmapItems
      .filter((item) => item.roadmap_id === roadmapId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  getRoadmapItemById(itemId: number): RoadmapItem | undefined {
    return this.roadmapItems.find((item) => item.id === itemId);
  }

  saveRoadmap(
    studentId: number,
    careerId: number,
    careerTitle: string,
    itemsData: Array<Omit<RoadmapItem, 'id' | 'roadmap_id' | 'student_id' | 'created_at' | 'updated_at'>>
  ): { roadmap: Roadmap; items: RoadmapItem[] } {
    const now = new Date().toISOString();

    // Check if an existing roadmap exists for this student
    let roadmap = this.roadmaps.find((r) => r.student_id === studentId);

    const totalItems = itemsData.length;
    const completedItems = itemsData.filter((i) => i.status === 'Completed').length;
    const overallCompletion = totalItems === 0
      ? 0
      : Math.round(itemsData.reduce((acc, curr) => acc + curr.completion_percentage, 0) / totalItems);

    if (roadmap) {
      roadmap.career_id = careerId;
      roadmap.target_career_title = careerTitle;
      roadmap.title = `${careerTitle} Learning Roadmap`;
      roadmap.total_items = totalItems;
      roadmap.completed_items = completedItems;
      roadmap.overall_completion = overallCompletion;
      roadmap.updated_at = now;
    } else {
      roadmap = {
        id: this.nextRoadmapId++,
        student_id: studentId,
        career_id: careerId,
        title: `${careerTitle} Learning Roadmap`,
        target_career_title: careerTitle,
        total_items: totalItems,
        completed_items: completedItems,
        overall_completion: overallCompletion,
        created_at: now,
        updated_at: now,
      };
      this.roadmaps.push(roadmap);
    }

    // Remove old roadmap items for this roadmap to avoid duplicates
    this.roadmapItems = this.roadmapItems.filter((item) => item.roadmap_id !== roadmap!.id);

    // Insert new sequenced roadmap items
    const newItems: RoadmapItem[] = itemsData.map((data, idx) => ({
      id: this.nextRoadmapItemId++,
      roadmap_id: roadmap!.id,
      student_id: studentId,
      sequence: idx + 1,
      skill_id: data.skill_id,
      skill_name: data.skill_name,
      skill_category: data.skill_category,
      topic: data.topic,
      description: data.description,
      why_needed: data.why_needed,
      current_proficiency: data.current_proficiency,
      required_proficiency: data.required_proficiency,
      skill_gap: data.skill_gap,
      importance: data.importance,
      priority: data.priority,
      difficulty: data.difficulty,
      estimated_duration: data.estimated_duration,
      prerequisites: data.prerequisites,
      learning_resource: data.learning_resource,
      status: data.status,
      completion_percentage: data.completion_percentage,
      created_at: now,
      updated_at: now,
    }));

    this.roadmapItems.push(...newItems);
    this.save();

    return { roadmap, items: newItems };
  }

  updateRoadmapItem(
    itemId: number,
    update: { status?: 'Not Started' | 'In Progress' | 'Completed'; completion_percentage?: number }
  ): { item: RoadmapItem; roadmap: Roadmap } | null {
    const item = this.roadmapItems.find((i) => i.id === itemId);
    if (!item) return null;

    const roadmap = this.roadmaps.find((r) => r.id === item.roadmap_id);
    if (!roadmap) return null;

    const now = new Date().toISOString();

    if (update.completion_percentage !== undefined) {
      const pct = Math.max(0, Math.min(100, Math.round(update.completion_percentage)));
      item.completion_percentage = pct;
      if (pct === 100) {
        item.status = 'Completed';
      } else if (pct === 0) {
        if (update.status) item.status = update.status;
        else item.status = 'Not Started';
      } else {
        item.status = 'In Progress';
      }
    }

    if (update.status !== undefined) {
      item.status = update.status;
      if (update.status === 'Completed') {
        item.completion_percentage = 100;
      } else if (update.status === 'Not Started' && (update.completion_percentage === undefined || update.completion_percentage === 0)) {
        item.completion_percentage = 0;
      } else if (update.status === 'In Progress' && (item.completion_percentage === 0 || item.completion_percentage === 100)) {
        item.completion_percentage = 50;
      }
    }

    item.updated_at = now;

    // Recalculate parent roadmap totals
    const siblingItems = this.getRoadmapItems(roadmap.id);
    const totalItems = siblingItems.length;
    roadmap.total_items = totalItems;
    roadmap.completed_items = siblingItems.filter((i) => i.status === 'Completed').length;
    roadmap.overall_completion = totalItems === 0
      ? 0
      : Math.round(siblingItems.reduce((sum, curr) => sum + curr.completion_percentage, 0) / totalItems);
    roadmap.updated_at = now;
    this.save();

    return { item, roadmap };
  }

  deleteRoadmapForStudent(studentId: number): void {
    const roadmap = this.roadmaps.find((r) => r.student_id === studentId);
    if (roadmap) {
      this.roadmapItems = this.roadmapItems.filter((item) => item.roadmap_id !== roadmap.id);
      this.roadmaps = this.roadmaps.filter((r) => r.id !== roadmap.id);
      this.save();
    }
  }

  // ==================== Prerequisite Management (Phase 5) ====================
  getAllPrerequisites() {
    return this.skillPrerequisites.map((p) => {
      const target = this.getSkillById(p.skill_id);
      const prereq = this.getSkillById(p.prerequisite_skill_id);
      return {
        id: p.id,
        skill_id: p.skill_id,
        target_skill_name: target?.name || 'Unknown Skill',
        target_skill_category: target?.category || 'General',
        prerequisite_skill_id: p.prerequisite_skill_id,
        prerequisite_skill_name: prereq?.name || 'Unknown Skill',
        prerequisite_skill_category: prereq?.category || 'General',
      };
    });
  }

  addPrerequisite(skillId: number, prerequisiteSkillId: number): { success: boolean; prerequisite?: SkillPrerequisite; error?: string } {
    if (skillId === prerequisiteSkillId) {
      return { success: false, error: 'A skill cannot be a prerequisite of itself.' };
    }

    const targetSkill = this.getSkillById(skillId);
    const prereqSkill = this.getSkillById(prerequisiteSkillId);
    if (!targetSkill || !prereqSkill) {
      return { success: false, error: 'One or both specified skills do not exist.' };
    }

    const existing = this.skillPrerequisites.find(
      (p) => p.skill_id === skillId && p.prerequisite_skill_id === prerequisiteSkillId
    );
    if (existing) {
      return { success: false, error: 'This prerequisite relationship already exists.' };
    }

    // Cycle detection: check if prerequisiteSkillId already depends directly or indirectly on skillId
    const queue = [prerequisiteSkillId];
    const visited = new Set<number>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === skillId) {
        return {
          success: false,
          error: `Circular dependency detected: "${prereqSkill.name}" already depends on "${targetSkill.name}" directly or indirectly.`,
        };
      }
      visited.add(current);
      const parentPrereqs = this.getPrerequisiteIdsForSkill(current);
      for (const pid of parentPrereqs) {
        if (!visited.has(pid)) {
          queue.push(pid);
        }
      }
    }

    const newPrereq: SkillPrerequisite = {
      id: this.nextPrerequisiteId++,
      skill_id: skillId,
      prerequisite_skill_id: prerequisiteSkillId,
    };
    this.skillPrerequisites.push(newPrereq);
    this.save();
    return { success: true, prerequisite: newPrereq };
  }

  deletePrerequisite(id: number): boolean {
    const idx = this.skillPrerequisites.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.skillPrerequisites.splice(idx, 1);
    this.save();
    return true;
  }

  // ==================== Job Description Analysis Methods (Phase 5) ====================
  createJobAnalysis(studentId: number, data: {
    job_title: string;
    company: string;
    job_description: string;
    match_score: number;
    readiness_classification: 'Highly Ready' | 'Developing' | 'Needs Improvement' | 'Beginner';
    identified_skills_count: number;
    skills_satisfied_count: number;
    skills_gap_count: number;
    missing_skills_count: number;
    major_gaps_count: number;
    skills: any[];
    recommended_next_skills?: any[];
  }): JobAnalysis {
    const now = new Date().toISOString();
    const analysisId = this.nextJobAnalysisId++;

    const skills: JobAnalysisSkill[] = data.skills.map((s) => ({
      id: this.nextJobAnalysisSkillId++,
      analysis_id: analysisId,
      skill_id: s.skill_id,
      skill_name: s.skill_name,
      skill_category: s.skill_category,
      required_proficiency: s.required_proficiency,
      student_proficiency: s.student_proficiency,
      skill_gap: s.skill_gap,
      status: s.status,
      is_core: s.is_core,
      importance: s.importance,
      is_estimated: !!s.is_estimated,
      recommendation_reason: s.recommendation_reason,
    }));

    const analysis: JobAnalysis = {
      id: analysisId,
      student_id: studentId,
      job_title: data.job_title || 'Target Position Analysis',
      company: data.company || 'Prospective Employer',
      job_description: data.job_description,
      match_score: data.match_score,
      readiness_classification: data.readiness_classification,
      identified_skills_count: data.identified_skills_count,
      skills_satisfied_count: data.skills_satisfied_count,
      skills_gap_count: data.skills_gap_count,
      missing_skills_count: data.missing_skills_count,
      major_gaps_count: data.major_gaps_count,
      created_at: now,
      skills,
      recommended_next_skills: data.recommended_next_skills || [],
    };

    this.jobAnalyses.unshift(analysis);
    this.save();

    this.logActivity(
      studentId,
      'job_analyzed',
      `Analyzed Job: ${analysis.job_title}`,
      `Calculated ${analysis.match_score}% match across ${analysis.identified_skills_count} extracted job requirements.`
    );
    this.checkAndUnlockAchievements(studentId);
    this.recordProgressSnapshot(studentId, `Job Analyzed: ${analysis.job_title}`);

    return analysis;
  }

  getJobAnalysesByStudentId(studentId: number): JobAnalysis[] {
    return this.jobAnalyses
      .filter((j) => j.student_id === studentId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getJobAnalysisById(id: number, studentId?: number): JobAnalysis | undefined {
    return this.jobAnalyses.find(
      (j) => j.id === id && (studentId === undefined || j.student_id === studentId)
    );
  }

  deleteJobAnalysis(id: number, studentId?: number): boolean {
    const idx = this.jobAnalyses.findIndex(
      (j) => j.id === id && (studentId === undefined || j.student_id === studentId)
    );
    if (idx === -1) return false;
    this.jobAnalyses.splice(idx, 1);
    this.save();
    return true;
  }

  appendJobSkillsToRoadmap(
    studentId: number,
    jobSkills: Array<{
      skill_id: number;
      skill_name: string;
      skill_category: string;
      required_proficiency: number;
      student_proficiency: number;
      skill_gap: number;
      importance: 'Critical' | 'Important' | 'Optional' | string;
      job_title?: string;
    }>
  ): { success: boolean; addedCount: number; roadmap: Roadmap | null; message: string } {
    const now = new Date().toISOString();
    let roadmap = this.roadmaps.find((r) => r.student_id === studentId);

    // If student has no roadmap yet, create one
    if (!roadmap) {
      const student = this.getUserById(studentId);
      const career = student?.target_career_id ? this.getCareerById(student.target_career_id) : null;
      const title = career ? `${career.title} & Job Target Roadmap` : 'Personalized Target Job Roadmap';
      roadmap = {
        id: this.nextRoadmapId++,
        student_id: studentId,
        career_id: career?.id || 0,
        title,
        target_career_title: career?.title || 'Target Job Role',
        total_items: 0,
        completed_items: 0,
        overall_completion: 0,
        created_at: now,
        updated_at: now,
      };
      this.roadmaps.push(roadmap);
    }

    const existingItems = this.roadmapItems.filter((i) => i.roadmap_id === roadmap!.id);
    const existingSkillIds = new Set(existingItems.map((i) => i.skill_id));

    // Filter to gap skills not already in the roadmap
    const gapsToAdd = jobSkills.filter((s) => s.skill_gap > 0 && !existingSkillIds.has(s.skill_id));

    if (gapsToAdd.length === 0) {
      return {
        success: true,
        addedCount: 0,
        roadmap,
        message: 'All job skills with gaps are already included in your roadmap.',
      };
    }

    let nextSequence = existingItems.length + 1;
    const newRoadmapItems: RoadmapItem[] = [];

    for (const skill of gapsToAdd) {
      // Find matching resource
      const resource = this.learningResources.find((r) => r.skill_id === skill.skill_id) || null;
      // Find prerequisites
      const prereqs = this.getPrerequisitesForSkill(skill.skill_id).map((p) => p.name);

      const newItem: RoadmapItem = {
        id: this.nextRoadmapItemId++,
        roadmap_id: roadmap.id,
        student_id: studentId,
        sequence: nextSequence++,
        skill_id: skill.skill_id,
        skill_name: skill.skill_name,
        skill_category: skill.skill_category,
        topic: `${skill.skill_name} Targeted Skill Mastery`,
        description: `Targeted module to close job gap of ${skill.skill_gap} level(s) for ${skill.skill_name}.`,
        why_needed: `Required by target job role at proficiency level ${skill.required_proficiency}. Current level is ${skill.student_proficiency}.`,
        current_proficiency: skill.student_proficiency,
        required_proficiency: skill.required_proficiency,
        skill_gap: skill.skill_gap,
        importance: (skill.importance === 'Critical' ? 'Critical' : skill.importance === 'Optional' ? 'Optional' : 'Important') as 'Critical' | 'Important' | 'Optional',
        priority: skill.importance === 'Critical' ? 'High' : skill.importance === 'Important' ? 'Medium' : 'Low',
        difficulty: skill.required_proficiency >= 4 ? 'Advanced' : skill.required_proficiency >= 3 ? 'Intermediate' : 'Beginner',
        estimated_duration: `${Math.max(1, skill.skill_gap * 2)} weeks`,
        prerequisites: prereqs,
        learning_resource: resource
          ? {
              id: resource.id,
              title: resource.title,
              url: resource.url,
              resource_type: resource.resource_type,
              difficulty_level: resource.difficulty_level,
              platform: resource.platform,
            }
          : null,
        status: 'Not Started',
        completion_percentage: 0,
        created_at: now,
        updated_at: now,
      };
      newRoadmapItems.push(newItem);
    }

    this.roadmapItems.push(...newRoadmapItems);

    // Recalculate roadmap summary
    const allItems = this.getRoadmapItems(roadmap.id);
    roadmap.total_items = allItems.length;
    roadmap.completed_items = allItems.filter((i) => i.status === 'Completed').length;
    roadmap.overall_completion = allItems.length === 0
      ? 0
      : Math.round(allItems.reduce((sum, curr) => sum + curr.completion_percentage, 0) / allItems.length);
    roadmap.updated_at = now;

    this.save();

    return {
      success: true,
      addedCount: newRoadmapItems.length,
      roadmap,
      message: `Successfully added ${newRoadmapItems.length} job-specific skill requirement(s) to your roadmap.`,
    };
  }

  // ==================== Analytics Methods (Phase 5) ====================
  getStudentAnalytics(studentId: number) {
    const student = this.getUserById(studentId);
    if (!student) return null;

    const studentSkills = this.getStudentSkills(studentId);
    const roadmap = this.roadmaps.find((r) => r.student_id === studentId);
    const roadmapItems = roadmap ? this.getRoadmapItems(roadmap.id) : [];
    const jobAnalyses = this.getJobAnalysesByStudentId(studentId);
    const targetCareer = student.target_career_id ? this.getCareerById(student.target_career_id) : null;

    // 1. Skill distribution: Strong (>=4), Developing (2-3), Weak (1), Missing (0)
    let strongCount = 0;
    let developingCount = 0;
    let weakCount = 0;

    for (const ss of studentSkills) {
      if (ss.proficiency >= 4) strongCount++;
      else if (ss.proficiency >= 2) developingCount++;
      else weakCount++;
    }

    // 2. Roadmap progress
    const totalRoadmapItems = roadmapItems.length;
    const completedRoadmapItems = roadmapItems.filter((i) => i.status === 'Completed').length;
    const inProgressRoadmapItems = roadmapItems.filter((i) => i.status === 'In Progress').length;
    const notStartedRoadmapItems = roadmapItems.filter((i) => i.status === 'Not Started').length;

    // 3. Career readiness computation (if target career set)
    let readinessScore = 0;
    let readinessClassification: 'Highly Ready' | 'Developing' | 'Needs Improvement' | 'Beginner' = 'Beginner';
    let topSkillGaps: Array<{ skill_name: string; current: number; required: number; gap: number; importance: string }> = [];

    if (targetCareer) {
      const roleSkills = this.roleSkills.filter((rs) => rs.role_id === targetCareer.id);
      const studentSkillMap = new Map<number, number>();
      studentSkills.forEach((s) => studentSkillMap.set(s.skill_id, s.proficiency));

      let weightedMatch = 0;
      let totalWeight = 0;
      const gaps: any[] = [];

      for (const rs of roleSkills) {
        const current = studentSkillMap.get(rs.skill_id) || 0;
        const required = rs.required_proficiency;
        const gap = Math.max(0, required - current);
        const weight = rs.is_core ? 5 : 3;

        weightedMatch += weight * (required > 0 ? Math.min(current, required) / required : 1);
        totalWeight += weight;

        if (gap > 0) {
          const sk = this.getSkillById(rs.skill_id);
          gaps.push({
            skill_name: sk?.name || 'Unknown',
            current,
            required,
            gap,
            importance: rs.is_core ? 'Critical' : 'Important',
          });
        }
      }

      readinessScore = totalWeight > 0 ? Math.round((weightedMatch / totalWeight) * 100) : 0;
      if (readinessScore >= 80) readinessClassification = 'Highly Ready';
      else if (readinessScore >= 60) readinessClassification = 'Developing';
      else if (readinessScore >= 40) readinessClassification = 'Needs Improvement';
      else readinessClassification = 'Beginner';

      topSkillGaps = gaps.sort((a, b) => b.gap - a.gap).slice(0, 5);
    }

    // 4. Recommended next skill to study
    let recommendedNextSkill: any = null;
    const uncompletedItem = roadmapItems.find((i) => i.status !== 'Completed');
    if (uncompletedItem) {
      recommendedNextSkill = {
        skill_name: uncompletedItem.skill_name,
        status: uncompletedItem.status,
        gap: uncompletedItem.skill_gap,
        topic: uncompletedItem.topic,
        learning_resource: uncompletedItem.learning_resource,
      };
    } else if (topSkillGaps.length > 0) {
      recommendedNextSkill = {
        skill_name: topSkillGaps[0].skill_name,
        status: 'Not Started',
        gap: topSkillGaps[0].gap,
        topic: `Foundations in ${topSkillGaps[0].skill_name}`,
        learning_resource: null,
      };
    }

    return {
      student_name: student.full_name,
      target_career: targetCareer ? { id: targetCareer.id, title: targetCareer.title } : null,
      readiness_score: readinessScore,
      readiness_classification: readinessClassification,
      skills_summary: {
        total_skills: studentSkills.length,
        strong: strongCount,
        developing: developingCount,
        weak: weakCount,
      },
      roadmap_summary: {
        total_items: totalRoadmapItems,
        completed: completedRoadmapItems,
        in_progress: inProgressRoadmapItems,
        not_started: notStartedRoadmapItems,
        completion_rate: roadmap?.overall_completion || 0,
      },
      top_skill_gaps: topSkillGaps,
      recommended_next_skill: recommendedNextSkill,
      job_analyses_count: jobAnalyses.length,
      latest_job_match: jobAnalyses.length > 0 ? jobAnalyses[0].match_score : null,
    };
  }

  getAdminAnalytics() {
    const totalStudents = this.users.filter((u) => u.role === 'student').length;
    const totalCareers = this.careerRoles.length;
    const totalSkills = this.skills.length;
    const totalResources = this.learningResources.length;
    const totalRoadmaps = this.roadmaps.length;
    const totalJobAnalyses = this.jobAnalyses.length;

    // 1. Career popularity (how many students picked each target career)
    const careerCounts: Record<number, number> = {};
    for (const u of this.users) {
      if (u.role === 'student' && u.target_career_id) {
        careerCounts[u.target_career_id] = (careerCounts[u.target_career_id] || 0) + 1;
      }
    }
    const careerPopularity = this.careerRoles
      .map((c) => ({
        id: c.id,
        title: c.title,
        students_count: careerCounts[c.id] || 0,
      }))
      .sort((a, b) => b.students_count - a.students_count);

    // 2. Average student readiness score across students with target career
    const readinessScores: number[] = [];
    const readinessDistribution = {
      'Highly Ready': 0,
      'Developing': 0,
      'Needs Improvement': 0,
      'Beginner': 0,
    };

    const studentSkillGapsCount: Record<number, number> = {};

    for (const u of this.users) {
      if (u.role === 'student' && u.target_career_id) {
        const cSkills = this.roleSkills.filter((rs) => rs.role_id === u.target_career_id);
        if (cSkills.length > 0) {
          const sSkills = this.getStudentSkills(u.id);
          const sSkillMap = new Map<number, number>();
          sSkills.forEach((s) => sSkillMap.set(s.skill_id, s.proficiency));

          let weightedMatch = 0;
          let totalWeight = 0;

          for (const rs of cSkills) {
            const current = sSkillMap.get(rs.skill_id) || 0;
            const required = rs.required_proficiency;
            const gap = Math.max(0, required - current);
            const weight = rs.is_core ? 5 : 3;

            weightedMatch += weight * (required > 0 ? Math.min(current, required) / required : 1);
            totalWeight += weight;

            if (gap > 0) {
              studentSkillGapsCount[rs.skill_id] = (studentSkillGapsCount[rs.skill_id] || 0) + 1;
            }
          }

          const score = totalWeight > 0 ? Math.round((weightedMatch / totalWeight) * 100) : 0;
          readinessScores.push(score);

          if (score >= 80) readinessDistribution['Highly Ready']++;
          else if (score >= 60) readinessDistribution['Developing']++;
          else if (score >= 40) readinessDistribution['Needs Improvement']++;
          else readinessDistribution['Beginner']++;
        }
      }
    }

    const avgReadiness = readinessScores.length > 0
      ? Math.round(readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length)
      : 0;

    // 3. Most common skill gaps
    const commonSkillGaps = Object.entries(studentSkillGapsCount)
      .map(([skillId, count]) => {
        const sk = this.getSkillById(Number(skillId));
        return {
          skill_id: Number(skillId),
          skill_name: sk?.name || 'Unknown',
          skill_category: sk?.category || 'General',
          affected_students_count: count,
        };
      })
      .sort((a, b) => b.affected_students_count - a.affected_students_count)
      .slice(0, 8);

    // 4. Roadmap completion brackets
    const roadmapBrackets = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-100%': 0,
    };
    for (const r of this.roadmaps) {
      const comp = r.overall_completion || 0;
      if (comp <= 25) roadmapBrackets['0-25%']++;
      else if (comp <= 50) roadmapBrackets['26-50%']++;
      else if (comp <= 75) roadmapBrackets['51-75%']++;
      else roadmapBrackets['76-100%']++;
    }

    return {
      totals: {
        students: totalStudents,
        careers: totalCareers,
        skills: totalSkills,
        resources: totalResources,
        roadmaps: totalRoadmaps,
        job_analyses: totalJobAnalyses,
        avg_readiness: avgReadiness,
      },
      total_students: totalStudents,
      total_careers: totalCareers,
      total_skills: totalSkills,
      total_resources: totalResources,
      total_roadmaps: totalRoadmaps,
      total_job_analyses: totalJobAnalyses,
      avg_readiness: avgReadiness,
      career_popularity: careerPopularity,
      readiness_distribution: readinessDistribution,
      common_skill_gaps: commonSkillGaps,
      roadmap_brackets: roadmapBrackets,
    };
  }

  // ==================== Phase 6: Achievements, Activity, Progress & Resume ====================

  getAllAchievements(): Achievement[] {
    return DEFAULT_ACHIEVEMENTS;
  }

  getUserAchievements(userId: number): Array<{
    achievement: Achievement;
    unlocked: boolean;
    unlocked_at: string | null;
  }> {
    const userUnlocks = new Map<string, string>();
    this.userAchievements
      .filter((ua) => ua.user_id === userId)
      .forEach((ua) => userUnlocks.set(ua.achievement_id, ua.unlocked_at));

    return DEFAULT_ACHIEVEMENTS.map((ach) => ({
      achievement: ach,
      unlocked: userUnlocks.has(ach.id),
      unlocked_at: userUnlocks.get(ach.id) || null,
    }));
  }

  checkAndUnlockAchievements(userId: number): Achievement[] {
    const student = this.getUserById(userId);
    if (!student || student.role !== 'student') return [];

    const existingUnlockedIds = new Set(
      this.userAchievements.filter((ua) => ua.user_id === userId).map((ua) => ua.achievement_id)
    );

    const newlyUnlocked: Achievement[] = [];
    const now = new Date().toISOString();

    const unlock = (achId: string) => {
      if (existingUnlockedIds.has(achId)) return;
      const ach = DEFAULT_ACHIEVEMENTS.find((a) => a.id === achId);
      if (!ach) return;

      this.userAchievements.push({
        id: this.nextUserAchievementId++,
        user_id: userId,
        achievement_id: achId,
        unlocked_at: now,
      });
      existingUnlockedIds.add(achId);
      newlyUnlocked.push(ach);

      // Log activity event
      this.logActivity(userId, 'achievement_unlocked', `Unlocked: ${ach.name}`, ach.description);
    };

    // 1. Roadmap milestones
    const roadmap = this.getRoadmapByStudentId(userId);
    if (roadmap) {
      const items = this.getRoadmapItems(roadmap.id);
      const completedCount = items.filter((i) => i.status === 'Completed').length;
      const completionPct = roadmap.overall_completion || 0;

      if (completedCount >= 1) unlock('first_step');
      if (completedCount >= 5) unlock('skill_builder');
      if (completionPct >= 25) unlock('roadmap_explorer');
      if (completionPct >= 50) unlock('halfway_there');
      if (completionPct >= 75) unlock('almost_ready');
      if (completionPct >= 100 && items.length > 0) unlock('career_ready');
    }

    // 2. Profile & skills milestones
    const studentSkills = this.getStudentSkills(userId);
    if (studentSkills.length >= 3) unlock('skill_starter');
    if (studentSkills.some((s) => s.proficiency === 5)) unlock('skill_master');

    // 3. Career decision
    if (student.target_career_id) unlock('career_decider');

    // 4. Job exploration
    const jobAnalyses = this.getJobAnalysesByStudentId(userId);
    if (jobAnalyses.length >= 1) unlock('job_explorer');

    // 5. Resume analysis
    const resumeAnalyses = this.resumeAnalyses.filter((r) => r.user_id === userId);
    if (resumeAnalyses.length >= 1) unlock('resume_ready');

    if (newlyUnlocked.length > 0) {
      this.save();
    }

    return newlyUnlocked;
  }

  logActivity(
    userId: number,
    type: ActivityEvent['type'],
    title: string,
    description: string
  ): ActivityEvent {
    const event: ActivityEvent = {
      id: this.nextActivityEventId++,
      user_id: userId,
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
    };

    this.activityEvents.unshift(event);
    // Keep max 100 per user
    const userEvents = this.activityEvents.filter((e) => e.user_id === userId);
    if (userEvents.length > 100) {
      const toRemove = userEvents.slice(100);
      const toRemoveIds = new Set(toRemove.map((e) => e.id));
      this.activityEvents = this.activityEvents.filter((e) => !toRemoveIds.has(e.id));
    }

    this.save();
    return event;
  }

  getUserActivity(userId: number, limit: number = 20): ActivityEvent[] {
    return this.activityEvents
      .filter((e) => e.user_id === userId)
      .slice(0, limit);
  }

  recordProgressSnapshot(userId: number, triggerEvent: string): ProgressSnapshot | null {
    const student = this.getUserById(userId);
    if (!student || student.role !== 'student') return null;

    let readinessPct = 0;
    let targetCareerTitle: string | undefined;

    if (student.target_career_id) {
      const career = this.getCareerById(student.target_career_id);
      targetCareerTitle = career?.title;
      const roleSkills = this.getRoleSkillsByRoleId(student.target_career_id);
      const studentSkills = this.getStudentSkills(userId);
      const studentSkillsMap = new Map(studentSkills.map((s) => [s.skill_id, s.proficiency]));

      if (roleSkills.length > 0) {
        let totalReq = 0;
        let totalAcquired = 0;
        roleSkills.forEach((rs) => {
          totalReq += rs.required_proficiency;
          totalAcquired += Math.min(rs.required_proficiency, studentSkillsMap.get(rs.skill_id) || 0);
        });
        readinessPct = totalReq > 0 ? Math.round((totalAcquired / totalReq) * 100) : 0;
      }
    }

    const roadmap = this.getRoadmapByStudentId(userId);
    const roadmapComp = roadmap ? roadmap.overall_completion : 0;
    const skillsLogged = this.getStudentSkills(userId).length;

    const snapshot: ProgressSnapshot = {
      id: this.nextProgressSnapshotId++,
      user_id: userId,
      timestamp: new Date().toISOString(),
      readiness_percentage: readinessPct,
      skills_logged: skillsLogged,
      roadmap_completion: roadmapComp,
      target_career_title: targetCareerTitle,
      trigger_event: triggerEvent,
    };

    this.progressSnapshots.push(snapshot);
    // Keep max 50 snapshots per user
    const userSnaps = this.progressSnapshots.filter((s) => s.user_id === userId);
    if (userSnaps.length > 50) {
      const toRemove = userSnaps.slice(0, userSnaps.length - 50);
      const toRemoveIds = new Set(toRemove.map((s) => s.id));
      this.progressSnapshots = this.progressSnapshots.filter((s) => !toRemoveIds.has(s.id));
    }

    this.save();
    return snapshot;
  }

  captureProgressSnapshot(userId: number, triggerEvent: string): ProgressSnapshot | null {
    return this.recordProgressSnapshot(userId, triggerEvent);
  }

  getUserProgressHistory(userId: number): {
    snapshots: ProgressSnapshot[];
    insight: string | null;
  } {
    const userSnaps = this.progressSnapshots
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let insight: string | null = null;
    if (userSnaps.length >= 2) {
      const oldest = userSnaps[0];
      const newest = userSnaps[userSnaps.length - 1];
      const diff = newest.readiness_percentage - oldest.readiness_percentage;
      if (diff > 0) {
        insight = `You improved from ${oldest.readiness_percentage}% to ${newest.readiness_percentage}% readiness (+${diff}%) based on your recorded skill mastery and milestone completions.`;
      } else if (newest.roadmap_completion > oldest.roadmap_completion) {
        insight = `Roadmap progress increased from ${oldest.roadmap_completion}% to ${newest.roadmap_completion}% across your recent learning milestones.`;
      }
    }

    return {
      snapshots: userSnaps,
      insight,
    };
  }

  saveResumeAnalysis(
    userId: number,
    data: Omit<ResumeAnalysisRecord, 'id' | 'user_id' | 'created_at'>
  ): ResumeAnalysisRecord {
    const record: ResumeAnalysisRecord = {
      id: this.nextResumeAnalysisId++,
      user_id: userId,
      created_at: new Date().toISOString(),
      ...data,
    };

    this.resumeAnalyses.unshift(record);
    this.save();

    // Log activity
    this.logActivity(
      userId,
      'resume_analyzed',
      `Analyzed Resume: ${data.filename}`,
      `Extracted ${data.parsed_skills.length} technical competencies and tools.`
    );

    // Check achievements
    this.checkAndUnlockAchievements(userId);

    return record;
  }

  getLatestResumeAnalysis(userId: number): ResumeAnalysisRecord | null {
    const list = this.resumeAnalyses.filter((r) => r.user_id === userId);
    return list.length > 0 ? list[0] : null;
  }

  getResumeAnalysisById(id: number, userId: number): ResumeAnalysisRecord | null {
    return this.resumeAnalyses.find((r) => r.id === id && r.user_id === userId) || null;
  }

  compareCareers(
    studentId: number,
    careerIds: number[]
  ): {
    careers: Array<{
      id: number;
      title: string;
      category: string;
      description: string;
      average_salary: string | null;
      required_skills_count: number;
      match_readiness_percentage: number;
      major_gaps_count: number;
      missing_skills_count: number;
      estimated_workload_weeks: number;
      skills: Array<{
        skill_id: number;
        skill_name: string;
        skill_category: string;
        required_proficiency: number;
        student_proficiency: number;
        skill_gap: number;
        importance: 'Critical' | 'Important' | 'Optional';
        is_satisfied: boolean;
      }>;
    }>;
    transferable_skills: Array<{
      skill_id: number;
      skill_name: string;
      skill_category: string;
      careers_count: number;
      career_titles: string[];
      student_proficiency: number;
      max_required_proficiency: number;
      explanation: string;
    }>;
  } {
    const studentSkills = this.getStudentSkills(studentId);
    const studentSkillsMap = new Map<number, number>();
    studentSkills.forEach((ss) => studentSkillsMap.set(ss.skill_id, ss.proficiency));

    const comparedCareers = [];
    const skillAppearanceMap = new Map<
      number,
      {
        skill_id: number;
        skill_name: string;
        skill_category: string;
        career_titles: string[];
        max_required: number;
      }
    >();

    for (const cid of careerIds) {
      const career = this.getCareerById(cid);
      if (!career) continue;

      const roleSkills = this.getRoleSkillsByRoleId(career.id);
      let totalReqScore = 0;
      let totalAcquiredScore = 0;
      let majorGaps = 0;
      let missingSkills = 0;
      let totalWeeks = 0;

      const skillList = roleSkills.map((rs) => {
        const sk = this.getSkillById(rs.skill_id);
        const skillName = sk ? sk.name : 'Unknown Skill';
        const skillCategory = sk ? sk.category : 'General';
        const studentProf = studentSkillsMap.get(rs.skill_id) || 0;
        const gap = Math.max(0, rs.required_proficiency - studentProf);

        totalReqScore += rs.required_proficiency;
        totalAcquiredScore += Math.min(rs.required_proficiency, studentProf);

        if (gap >= 2) majorGaps++;
        if (studentProf === 0) missingSkills++;
        totalWeeks += Math.max(0, gap * 2);

        // Track appearance across careers for transferable skills
        if (!skillAppearanceMap.has(rs.skill_id)) {
          skillAppearanceMap.set(rs.skill_id, {
            skill_id: rs.skill_id,
            skill_name: skillName,
            skill_category: skillCategory,
            career_titles: [career.title],
            max_required: rs.required_proficiency,
          });
        } else {
          const entry = skillAppearanceMap.get(rs.skill_id)!;
          if (!entry.career_titles.includes(career.title)) {
            entry.career_titles.push(career.title);
          }
          entry.max_required = Math.max(entry.max_required, rs.required_proficiency);
        }

        return {
          skill_id: rs.skill_id,
          skill_name: skillName,
          skill_category: skillCategory,
          required_proficiency: rs.required_proficiency,
          student_proficiency: studentProf,
          skill_gap: gap,
          importance: rs.importance || (rs.is_core ? 'Critical' : 'Important'),
          is_satisfied: gap === 0,
        };
      });

      const matchPct = totalReqScore > 0 ? Math.round((totalAcquiredScore / totalReqScore) * 100) : 0;

      comparedCareers.push({
        id: career.id,
        title: career.title,
        category: career.category,
        description: career.description,
        average_salary: (career as any).average_salary || null,
        required_skills_count: roleSkills.length,
        match_readiness_percentage: matchPct,
        major_gaps_count: majorGaps,
        missing_skills_count: missingSkills,
        estimated_workload_weeks: totalWeeks,
        skills: skillList,
      });
    }

    // Filter transferable skills (required by 2 or more selected careers)
    const transferableSkills = Array.from(skillAppearanceMap.values())
      .filter((entry) => entry.career_titles.length >= 2)
      .map((entry) => {
        const studentProf = studentSkillsMap.get(entry.skill_id) || 0;
        return {
          skill_id: entry.skill_id,
          skill_name: entry.skill_name,
          skill_category: entry.skill_category,
          careers_count: entry.career_titles.length,
          career_titles: entry.career_titles,
          student_proficiency: studentProf,
          max_required_proficiency: entry.max_required,
          explanation: `Required across ${entry.career_titles.join(' and ')}. Mastering ${entry.skill_name} simultaneously advances multiple career paths.`,
        };
      })
      .sort((a, b) => b.careers_count - a.careers_count);

    return {
      careers: comparedCareers,
      transferable_skills: transferableSkills,
    };
  }
}

export const store = new Store();
