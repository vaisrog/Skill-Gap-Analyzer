import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { store, User } from './store';
import { buildSkillGapAnalysis, PROFICIENCY_LABELS } from './analysis';
import { generateOrGetStudentRoadmap } from './roadmap';
import { extractSkillsFromJobDescription } from './jobAnalyzer';

const JWT_SECRET = process.env.JWT_SECRET || 'skill_gap_analyzer_jwt_secret_key_2026';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const apiRouter = express.Router();

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Authentication Middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token.', code: 'NO_TOKEN' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email?: string };
    let user = store.getUserById(parseInt(payload.sub, 10));
    if (!user && payload.email) {
      user = store.getUserByEmail(payload.email);
    }
    if (!user) {
      return res.status(401).json({ error: 'User not found or session expired.', code: 'USER_NOT_FOUND' });
    }
    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Authorization token has expired. Please login again.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token signature.', code: 'INVALID_TOKEN' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privilege required.' });
  }
  next();
}

export function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student privilege required.' });
  }
  next();
}

function generateToken(user: User): string {
  return jwt.sign({ sub: String(user.id), email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

// ==================== Health ====================
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'Skill Gap Analyzer & Learning Roadmap API',
    version: '1.0.0-node',
    db_uri_type: 'in-memory',
  });
});

// ==================== Auth Routes ====================
apiRouter.post('/api/auth/register', (req, res) => {
  const body = req.body || {};
  const fullNameRaw = body.full_name;
  const emailRaw = body.email;
  const qualificationRaw = body.qualification ?? '';
  const password = body.password;
  const graduationYearRaw = body.graduation_year;

  if (typeof fullNameRaw !== 'string' || typeof emailRaw !== 'string' || typeof qualificationRaw !== 'string') {
    return res.status(400).json({ error: 'Name, email address, and qualification must be text.' });
  }

  const fullName = fullNameRaw.trim();
  const email = emailRaw.trim().toLowerCase();
  const qualification = qualificationRaw.trim();

  if (!fullName || fullName.length > 100) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (!email || email.length > 120 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must contain at least 8 characters.' });
  }
  if (qualification.length > 100) {
    return res.status(400).json({ error: 'Educational qualification must be 100 characters or fewer.' });
  }

  if (store.getUserByEmail(email)) {
    return res.status(409).json({ error: `An account with email "${email}" already exists.` });
  }

  let graduationYear: number | null = null;
  if (graduationYearRaw !== undefined && graduationYearRaw !== null && String(graduationYearRaw).trim() !== '') {
    const gy = parseInt(String(graduationYearRaw), 10);
    if (isNaN(gy) || gy < 1900 || gy > 2100) {
      return res.status(400).json({ error: 'Graduation year must be between 1900 and 2100.' });
    }
    graduationYear = gy;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = store.createUser({
    full_name: fullName,
    email,
    password_hash: passwordHash,
    role: 'student',
    qualification: qualification || undefined,
    graduation_year: graduationYear,
  });

  const accessToken = generateToken(newUser);
  return res.status(201).json({
    message: 'User registered successfully.',
    access_token: accessToken,
    user: store.userToDict(newUser),
  });
});

apiRouter.post('/api/auth/login', (req, res) => {
  const body = req.body || {};
  const emailRaw = body.email;
  const password = body.password;

  if (typeof emailRaw !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password must be text.' });
  }

  const email = emailRaw.trim().toLowerCase();
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = store.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'No account found with this email address.' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  const accessToken = generateToken(user);
  return res.status(200).json({
    message: 'Login successful.',
    access_token: accessToken,
    user: store.userToDict(user),
  });
});

apiRouter.get('/api/auth/me', authenticateToken, (req, res) => {
  return res.status(200).json({ user: store.userToDict(req.user!) });
});

apiRouter.post('/api/auth/logout', (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully.' });
});

// ==================== Careers Routes ====================
apiRouter.get('/api/careers', (req, res) => {
  const roles = [...store.careerRoles].sort((a, b) => a.title.localeCompare(b.title));
  const mapped = roles.map((role) => store.careerToDict(role, true));
  return res.status(200).json({
    careers: mapped,
    career_roles: mapped,
  });
});

apiRouter.get('/api/careers/:id', (req, res) => {
  const roleId = parseInt(req.params.id, 10);
  const role = store.getCareerById(roleId);
  if (!role) {
    return res.status(404).json({ error: 'Career role not found.' });
  }
  const dict = store.careerToDict(role, true);
  return res.status(200).json({
    career: dict,
    career_role: dict,
  });
});

apiRouter.get('/api/careers/:id/requirements', (req, res) => {
  const roleId = parseInt(req.params.id, 10);
  const role = store.getCareerById(roleId);
  if (!role) {
    return res.status(404).json({ error: 'Career role not found.' });
  }

  const dict = store.careerToDict(role, true);
  const requirements = (dict.required_skills || []).sort((a: any, b: any) => {
    if (a.is_core !== b.is_core) return a.is_core ? -1 : 1;
    if (b.required_proficiency !== a.required_proficiency) return b.required_proficiency - a.required_proficiency;
    return (a.skill_name || '').localeCompare(b.skill_name || '');
  });

  const careerInfo = {
    id: role.id,
    title: role.title,
    description: role.description,
    category: role.category,
  };

  return res.status(200).json({
    career: careerInfo,
    career_role: careerInfo,
    requirements,
  });
});

apiRouter.post('/api/careers', authenticateToken, requireAdmin, (req, res) => {
  const body = req.body || {};
  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const icon = (body.icon || 'Briefcase').trim();
  const skillsData = body.skills || [];

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  if (store.getCareerByTitle(title)) {
    return res.status(409).json({ error: 'Career role with this title already exists.' });
  }

  const role = store.createCareer({
    title,
    description,
    icon,
    skills: skillsData,
  });

  return res.status(201).json({
    message: 'Career role created successfully.',
    career_role: store.careerToDict(role, true),
  });
});

apiRouter.put('/api/careers/:id', authenticateToken, requireAdmin, (req, res) => {
  const roleId = parseInt(req.params.id, 10);
  const role = store.getCareerById(roleId);
  if (!role) {
    return res.status(404).json({ error: 'Career role not found.' });
  }

  const body = req.body || {};
  const title = body.title !== undefined ? String(body.title).trim() : undefined;
  const description = body.description !== undefined ? String(body.description).trim() : undefined;
  const icon = body.icon !== undefined ? String(body.icon).trim() : undefined;

  if (title) {
    const existing = store.getCareerByTitle(title);
    if (existing && existing.id !== roleId) {
      return res.status(409).json({ error: 'Another career role with this title already exists.' });
    }
  }

  const updated = store.updateCareer(roleId, { title, description, icon });
  return res.status(200).json({
    message: 'Career role updated.',
    career_role: store.careerToDict(updated!, true),
  });
});

apiRouter.delete('/api/careers/:id', authenticateToken, requireAdmin, (req, res) => {
  const roleId = parseInt(req.params.id, 10);
  const deleted = store.deleteCareer(roleId);
  if (!deleted) {
    return res.status(404).json({ error: 'Career role not found.' });
  }
  return res.status(200).json({ message: 'Career role deleted successfully.' });
});

// ==================== Skills Routes ====================
apiRouter.get('/api/skills', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim();

  let list = [...store.skills];
  if (search) {
    list = list.filter((s) => s.name.toLowerCase().includes(search));
  }
  if (category) {
    list = list.filter((s) => s.category === category);
  }

  list.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  return res.status(200).json({
    skills: list.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      created_at: s.created_at,
    })),
  });
});

apiRouter.get('/api/skills/categories', (req, res) => {
  const set = new Set<string>();
  for (const s of store.skills) {
    if (s.category) set.add(s.category);
  }
  const categories = Array.from(set).sort();
  return res.status(200).json({ categories });
});

apiRouter.post('/api/skills', authenticateToken, requireAdmin, (req, res) => {
  const body = req.body || {};
  const name = (body.name || '').trim();
  const category = (body.category || '').trim();
  const description = (body.description || '').trim();

  if (!name || !category) {
    return res.status(400).json({ error: 'Skill name and category are required.' });
  }

  if (store.getSkillByName(name)) {
    return res.status(409).json({ error: 'Skill with this name already exists.' });
  }

  const skill = store.createSkill({ name, category, description });
  return res.status(201).json({
    message: 'Skill created successfully.',
    skill: {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      description: skill.description,
      created_at: skill.created_at,
    },
  });
});

apiRouter.put('/api/skills/:id', authenticateToken, requireAdmin, (req, res) => {
  const skillId = parseInt(req.params.id, 10);
  const skill = store.getSkillById(skillId);
  if (!skill) {
    return res.status(404).json({ error: 'Skill not found.' });
  }

  const body = req.body || {};
  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const category = body.category !== undefined ? String(body.category).trim() : undefined;
  const description = body.description !== undefined ? String(body.description).trim() : undefined;

  if (name) {
    const existing = store.getSkillByName(name);
    if (existing && existing.id !== skillId) {
      return res.status(409).json({ error: 'Skill with this name already exists.' });
    }
  }

  const updated = store.updateSkill(skillId, { name, category, description });
  return res.status(200).json({
    message: 'Skill updated successfully.',
    skill: {
      id: updated!.id,
      name: updated!.name,
      category: updated!.category,
      description: updated!.description,
      created_at: updated!.created_at,
    },
  });
});

apiRouter.delete('/api/skills/:id', authenticateToken, requireAdmin, (req, res) => {
  const skillId = parseInt(req.params.id, 10);
  const deleted = store.deleteSkill(skillId);
  if (!deleted) {
    return res.status(404).json({ error: 'Skill not found.' });
  }
  return res.status(200).json({ message: 'Skill deleted successfully.' });
});

// ==================== Learning Resources Routes ====================
apiRouter.get('/api/resources', (req, res) => {
  const skillId = req.query.skill_id ? parseInt(String(req.query.skill_id), 10) : undefined;
  const list = store.getResources(skillId);
  return res.status(200).json({
    resources: list.map((r) => store.resourceToDict(r)),
  });
});

apiRouter.post('/api/resources', authenticateToken, requireAdmin, (req, res) => {
  const body = req.body || {};
  const skillId = parseInt(body.skill_id, 10);
  const title = (body.title || '').trim();
  const url = (body.url || '').trim();
  const resourceType = (body.resource_type || 'Course').trim();
  const difficultyLevel = (body.difficulty_level || 'Beginner').trim();
  const platform = (body.platform || '').trim();

  if (!skillId || !title || !url) {
    return res.status(400).json({ error: 'Skill, title, and URL are required.' });
  }

  if (!store.getSkillById(skillId)) {
    return res.status(404).json({ error: 'Associated skill not found.' });
  }

  const resource = store.createResource({
    skill_id: skillId,
    title,
    url,
    resource_type: resourceType,
    difficulty_level: difficultyLevel,
    platform,
  });

  return res.status(201).json({
    message: 'Learning resource created.',
    resource: store.resourceToDict(resource),
  });
});

apiRouter.put('/api/resources/:id', authenticateToken, requireAdmin, (req, res) => {
  const resourceId = parseInt(req.params.id, 10);
  const body = req.body || {};
  const updateData: any = {};

  if (body.title !== undefined) updateData.title = String(body.title).trim();
  if (body.url !== undefined) updateData.url = String(body.url).trim();
  if (body.resource_type !== undefined) updateData.resource_type = String(body.resource_type).trim();
  if (body.difficulty_level !== undefined) updateData.difficulty_level = String(body.difficulty_level).trim();
  if (body.platform !== undefined) updateData.platform = String(body.platform).trim();
  if (body.skill_id !== undefined) updateData.skill_id = parseInt(body.skill_id, 10);

  const updated = store.updateResource(resourceId, updateData);
  if (!updated) {
    return res.status(404).json({ error: 'Resource not found.' });
  }

  return res.status(200).json({
    message: 'Resource updated.',
    resource: store.resourceToDict(updated),
  });
});

apiRouter.delete('/api/resources/:id', authenticateToken, requireAdmin, (req, res) => {
  const resourceId = parseInt(req.params.id, 10);
  const deleted = store.deleteResource(resourceId);
  if (!deleted) {
    return res.status(404).json({ error: 'Resource not found.' });
  }
  return res.status(200).json({ message: 'Resource deleted.' });
});

// ==================== User & Profile Routes ====================
apiRouter.get('/api/users/profile', authenticateToken, (req, res) => {
  return res.status(200).json({ user: store.userToDict(req.user!) });
});

apiRouter.put('/api/users/profile', authenticateToken, (req, res) => {
  const user = req.user!;
  const body = req.body || {};

  if (body.full_name !== undefined) {
    const fn = String(body.full_name).trim();
    if (!fn) return res.status(400).json({ error: 'Full name is required.' });
    if (fn.length > 100) return res.status(400).json({ error: 'Full name must be 100 characters or fewer.' });
    user.full_name = fn;
  }

  if (body.email !== undefined) {
    const em = String(body.email).trim().toLowerCase();
    if (!em || !EMAIL_PATTERN.test(em)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (em.length > 120) return res.status(400).json({ error: 'Email address must be 120 characters or fewer.' });
    const existing = store.getUserByEmail(em);
    if (existing && existing.id !== user.id) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }
    user.email = em;
  }

  if (body.qualification !== undefined) {
    const q = String(body.qualification || '').trim();
    if (q.length > 100) return res.status(400).json({ error: 'Educational qualification must be 100 characters or fewer.' });
    user.qualification = q || null;
  }

  if (body.graduation_year !== undefined) {
    const gyRaw = body.graduation_year;
    if (gyRaw === null || gyRaw === '') {
      user.graduation_year = null;
    } else {
      const gy = parseInt(String(gyRaw), 10);
      if (isNaN(gy) || gy < 1900 || gy > 2100) {
        return res.status(400).json({ error: 'Graduation year must be between 1900 and 2100.' });
      }
      user.graduation_year = gy;
    }
  }

  if (body.career_interest !== undefined) {
    const ci = String(body.career_interest || '').trim();
    if (ci.length > 150) return res.status(400).json({ error: 'Career interest must be 150 characters or fewer.' });
    user.career_interest = ci || null;
  }

  if (body.target_career_id !== undefined) {
    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can set a target career.' });
    }
    const tcIdRaw = body.target_career_id;
    if (tcIdRaw === null || tcIdRaw === '') {
      user.target_career_id = null;
    } else {
      const tcId = parseInt(String(tcIdRaw), 10);
      if (isNaN(tcId)) return res.status(400).json({ error: 'target_career_id must be an integer.' });
      const career = store.getCareerById(tcId);
      if (!career) return res.status(404).json({ error: 'Career role not found.' });
      user.target_career_id = tcId;
    }
  }

  user.updated_at = new Date().toISOString();
  return res.status(200).json({
    message: 'Profile updated successfully.',
    user: store.userToDict(user),
  });
});

apiRouter.get('/api/users/target-career', authenticateToken, requireStudent, (req, res) => {
  const user = req.user!;
  const career = user.target_career_id ? store.getCareerById(user.target_career_id) : null;
  return res.status(200).json({
    target_career: career ? store.careerToDict(career, false) : null,
  });
});

apiRouter.put('/api/users/target-career', authenticateToken, requireStudent, (req, res) => {
  const user = req.user!;
  const body = req.body || {};
  const careerIdRaw = body.career_id;

  if (careerIdRaw === null || careerIdRaw === undefined) {
    user.target_career_id = null;
    user.updated_at = new Date().toISOString();
    return res.status(200).json({
      message: 'Target career cleared.',
      user: store.userToDict(user),
    });
  }

  const careerId = parseInt(String(careerIdRaw), 10);
  if (isNaN(careerId)) {
    return res.status(400).json({ error: 'career_id must be an integer.' });
  }

  const career = store.getCareerById(careerId);
  if (!career) {
    return res.status(404).json({ error: 'Career role not found.' });
  }

  user.target_career_id = careerId;
  user.updated_at = new Date().toISOString();
  return res.status(200).json({
    message: `Target career set to "${career.title}".`,
    user: store.userToDict(user),
  });
});

apiRouter.get('/api/users/students', authenticateToken, requireAdmin, (req, res) => {
  const students = store.users
    .filter((u) => u.role === 'student')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return res.status(200).json({
    students: students.map((s) => store.userToDict(s)),
  });
});

// ==================== Student Skills Routes ====================
apiRouter.get('/api/student-skills', authenticateToken, requireStudent, (req, res) => {
  const mySkills = store.getStudentSkills(req.user!.id);
  return res.status(200).json({
    skills: mySkills.map((s) => store.studentSkillToDict(s)),
  });
});

apiRouter.post('/api/student-skills', authenticateToken, requireStudent, (req, res) => {
  const body = req.body || {};
  const skillIdRaw = body.skill_id;
  const proficiencyRaw = body.proficiency ?? 0;

  if (skillIdRaw === undefined || skillIdRaw === null) {
    return res.status(400).json({ error: 'skill_id is required.' });
  }

  const skillId = parseInt(String(skillIdRaw), 10);
  const proficiency = parseInt(String(proficiencyRaw), 10);

  if (isNaN(skillId) || isNaN(proficiency)) {
    return res.status(400).json({ error: 'skill_id and proficiency must be integers.' });
  }

  if (proficiency < 0 || proficiency > 5) {
    return res.status(400).json({ error: 'Proficiency must be between 0 and 5.' });
  }

  const skill = store.getSkillById(skillId);
  if (!skill) {
    return res.status(404).json({ error: 'Skill not found.' });
  }

  const { entry, wasCreated } = store.addOrUpdateStudentSkill(req.user!.id, skillId, proficiency);
  const label = PROFICIENCY_LABELS[proficiency];

  return res.status(wasCreated ? 201 : 200).json({
    message: wasCreated
      ? `Skill "${skill.name}" added with proficiency ${label}.`
      : `Skill "${skill.name}" already existed; proficiency updated to ${label}.`,
    skill: store.studentSkillToDict(entry),
  });
});

apiRouter.put('/api/student-skills/:id', authenticateToken, requireStudent, (req, res) => {
  const entryId = parseInt(req.params.id, 10);
  const existing = store.studentSkills.find((s) => s.id === entryId);

  if (!existing) {
    return res.status(404).json({ error: 'Skill entry not found.' });
  }

  if (existing.student_id !== req.user!.id) {
    return res.status(403).json({ error: 'You can only modify your own skill entries.' });
  }

  const proficiencyRaw = req.body?.proficiency;
  if (proficiencyRaw === undefined) {
    return res.status(400).json({ error: 'proficiency is required.' });
  }

  const proficiency = parseInt(String(proficiencyRaw), 10);
  if (isNaN(proficiency) || proficiency < 0 || proficiency > 5) {
    return res.status(400).json({ error: 'proficiency must be an integer between 0 and 5.' });
  }

  const updated = store.updateStudentSkillProficiency(entryId, proficiency);
  return res.status(200).json({
    message: `Proficiency updated to ${PROFICIENCY_LABELS[proficiency]}.`,
    skill: store.studentSkillToDict(updated!),
  });
});

apiRouter.delete('/api/student-skills/:id', authenticateToken, requireStudent, (req, res) => {
  const entryId = parseInt(req.params.id, 10);
  const existing = store.studentSkills.find((s) => s.id === entryId);

  if (!existing) {
    return res.status(404).json({ error: 'Skill entry not found.' });
  }

  if (existing.student_id !== req.user!.id) {
    return res.status(403).json({ error: 'You can only remove your own skill entries.' });
  }

  const skill = store.getSkillById(existing.skill_id);
  store.deleteStudentSkill(entryId);

  return res.status(200).json({
    message: `Skill "${skill ? skill.name : 'Unknown'}" removed from your profile.`,
  });
});

apiRouter.get('/api/student-skills/summary', authenticateToken, requireStudent, (req, res) => {
  const mySkills = store.getStudentSkills(req.user!.id);
  const byCategory: Record<string, number> = {};

  for (const s of mySkills) {
    const skill = store.getSkillById(s.skill_id);
    const cat = skill?.category || 'Unknown';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  const avgProficiency = mySkills.length
    ? Math.round((mySkills.reduce((acc, curr) => acc + curr.proficiency, 0) / mySkills.length) * 10) / 10
    : 0;

  return res.status(200).json({
    total_skills: mySkills.length,
    by_category: byCategory,
    avg_proficiency: avgProficiency,
  });
});

// ==================== Analysis Routes ====================
apiRouter.get('/api/analysis', authenticateToken, requireStudent, (req, res) => {
  const student = req.user!;
  const { analysis, errorCode } = buildSkillGapAnalysis(student);

  if (errorCode === 'no_target_career') {
    return res.status(409).json({
      error: 'Select a target career to analyze your skill gap.',
      code: errorCode,
    });
  }

  if (errorCode === 'no_career_requirements') {
    return res.status(409).json({
      error: 'The selected career has no skill requirements configured yet.',
      code: errorCode,
    });
  }

  return res.status(200).json({ analysis });
});

// ==================== Roadmap Routes (Phase 4) ====================
apiRouter.get('/api/roadmap', authenticateToken, requireStudent, (req, res) => {
  const student = req.user!;
  const result = generateOrGetStudentRoadmap(student, false);

  if (result.emptyState === 'no_target_career') {
    return res.status(409).json({
      error: 'Select a target career to generate your personalized learning roadmap.',
      code: 'no_target_career',
    });
  }

  if (result.emptyState === 'no_career_requirements') {
    return res.status(409).json({
      error: 'The selected career has no skill requirements configured yet.',
      code: 'no_career_requirements',
    });
  }

  if (result.emptyState === 'all_skills_satisfied') {
    return res.status(200).json({
      code: 'all_skills_satisfied',
      message: 'You currently meet or exceed all defined skill requirements for this career.',
      target_career: result.targetCareer,
      roadmap: null,
      items: [],
      recommended_next_skill: null,
      summary: result.summary,
    });
  }

  return res.status(200).json({
    roadmap: result.roadmap,
    items: result.items,
    recommended_next_skill: result.recommendedNextSkill,
    target_career: result.targetCareer,
    summary: result.summary,
  });
});

apiRouter.post(['/api/roadmap/generate', '/api/roadmap/regenerate'], authenticateToken, requireStudent, (req, res) => {
  const student = req.user!;
  const result = generateOrGetStudentRoadmap(student, true);

  if (result.emptyState === 'no_target_career') {
    return res.status(409).json({
      error: 'Select a target career to generate your personalized learning roadmap.',
      code: 'no_target_career',
    });
  }

  if (result.emptyState === 'no_career_requirements') {
    return res.status(409).json({
      error: 'The selected career has no skill requirements configured yet.',
      code: 'no_career_requirements',
    });
  }

  if (result.emptyState === 'all_skills_satisfied') {
    return res.status(200).json({
      code: 'all_skills_satisfied',
      message: 'You currently meet or exceed all defined skill requirements for this career.',
      target_career: result.targetCareer,
      roadmap: null,
      items: [],
      recommended_next_skill: null,
      summary: result.summary,
    });
  }

  return res.status(200).json({
    message: 'Roadmap generated successfully.',
    roadmap: result.roadmap,
    items: result.items,
    recommended_next_skill: result.recommendedNextSkill,
    target_career: result.targetCareer,
    summary: result.summary,
  });
});

apiRouter.put('/api/roadmap/items/:id', authenticateToken, requireStudent, (req, res) => {
  const student = req.user!;
  const itemId = parseInt(req.params.id, 10);

  if (isNaN(itemId)) {
    return res.status(400).json({ error: 'Invalid roadmap item ID.' });
  }

  const existingItem = store.getRoadmapItemById(itemId);
  if (!existingItem) {
    return res.status(404).json({ error: 'Roadmap item not found.' });
  }

  // Security check: ensure student owns this roadmap item
  if (existingItem.student_id !== student.id) {
    return res.status(403).json({ error: 'Unauthorized to modify this roadmap item.' });
  }

  const { status, completion_percentage } = req.body;

  const validStatuses = ['Not Started', 'In Progress', 'Completed'];
  if (status !== undefined && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  if (completion_percentage !== undefined) {
    const num = Number(completion_percentage);
    if (isNaN(num) || num < 0 || num > 100) {
      return res.status(400).json({
        error: 'Completion percentage must be a number between 0 and 100.',
      });
    }
  }

  const updateResult = store.updateRoadmapItem(itemId, {
    status,
    completion_percentage: completion_percentage !== undefined ? Number(completion_percentage) : undefined,
  });

  if (!updateResult) {
    return res.status(500).json({ error: 'Failed to update roadmap item.' });
  }

  // Determine updated next recommended skill
  const siblingItems = store.getRoadmapItems(updateResult.roadmap.id);
  const nextRecommended = siblingItems.find((item) => item.status !== 'Completed') || null;

  return res.status(200).json({
    message: 'Roadmap item updated successfully.',
    item: updateResult.item,
    roadmap: updateResult.roadmap,
    recommended_next_skill: nextRecommended,
  });
});

// ==================== Job Description Analyzer Routes (Phase 5) ====================

// Analyze job description
apiRouter.post('/api/job-analysis/analyze', authenticateToken, requireStudent, (req, res) => {
  const student = req.user!;
  const { job_title, company, job_description } = req.body;

  if (!job_description || typeof job_description !== 'string' || job_description.trim().length < 10) {
    return res.status(400).json({
      error: 'Please provide a valid job description (at least 10 characters).',
    });
  }

  const analysisResult = extractSkillsFromJobDescription(job_description.trim(), student);

  const savedAnalysis = store.createJobAnalysis(student.id, {
    job_title: (job_title && typeof job_title === 'string' ? job_title.trim() : '') || 'Target Job Position',
    company: (company && typeof company === 'string' ? company.trim() : '') || 'Prospective Employer',
    job_description: job_description.trim(),
    match_score: analysisResult.match_score,
    readiness_classification: analysisResult.readiness_classification,
    identified_skills_count: analysisResult.identified_skills_count,
    skills_satisfied_count: analysisResult.skills_satisfied_count,
    skills_gap_count: analysisResult.skills_gap_count,
    missing_skills_count: analysisResult.missing_skills_count,
    major_gaps_count: analysisResult.major_gaps_count,
    skills: analysisResult.skills,
    recommended_next_skills: analysisResult.recommended_next_skills,
  });

  return res.status(201).json({
    message: 'Job description analyzed successfully.',
    analysis: savedAnalysis,
    summary: {
      match_score: savedAnalysis.match_score,
      readiness_classification: savedAnalysis.readiness_classification,
      identified_skills_count: savedAnalysis.identified_skills_count,
      skills_satisfied_count: savedAnalysis.skills_satisfied_count,
      skills_gap_count: savedAnalysis.skills_gap_count,
      missing_skills_count: savedAnalysis.missing_skills_count,
      major_gaps_count: savedAnalysis.major_gaps_count,
    },
    recommendations: savedAnalysis.recommended_next_skills,
  });
});

// Get student's job analysis history
apiRouter.get('/api/job-analysis/history', authenticateToken, requireStudent, (req, res) => {
  const student = req.user!;
  const history = store.getJobAnalysesByStudentId(student.id);
  return res.status(200).json({
    total: history.length,
    history,
  });
});

// Get a single job analysis by ID (enforcing student ownership)
apiRouter.get('/api/job-analysis/:id', authenticateToken, requireStudent, (req, res) => {
  const student = req.user!;
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid analysis ID.' });
  }

  const analysis = store.getJobAnalysisById(id);
  if (!analysis) {
    return res.status(404).json({ error: 'Job analysis not found.' });
  }

  // Isolation check: only the student who created the analysis can view it
  if (analysis.student_id !== student.id) {
    return res.status(403).json({ error: 'Access denied. You can only access your own job analyses.' });
  }

  return res.status(200).json({ analysis });
});

// Delete a single job analysis
apiRouter.delete('/api/job-analysis/:id', authenticateToken, requireStudent, (req, res) => {
  const student = req.user!;
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid analysis ID.' });
  }

  const analysis = store.getJobAnalysisById(id);
  if (!analysis) {
    return res.status(404).json({ error: 'Job analysis not found.' });
  }

  if (analysis.student_id !== student.id) {
    return res.status(403).json({ error: 'Access denied. You can only delete your own job analyses.' });
  }

  store.deleteJobAnalysis(id, student.id);
  return res.status(200).json({ message: 'Job analysis deleted successfully.' });
});

// Add missing job gaps to student's roadmap
apiRouter.post('/api/job-analysis/:id/add-to-roadmap', authenticateToken, requireStudent, (req, res) => {
  const student = req.user!;
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid analysis ID.' });
  }

  const analysis = store.getJobAnalysisById(id);
  if (!analysis) {
    return res.status(404).json({ error: 'Job analysis not found.' });
  }

  if (analysis.student_id !== student.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const result = store.appendJobSkillsToRoadmap(student.id, analysis.skills);

  return res.status(200).json({
    message: result.message,
    added_count: result.addedCount,
    roadmap: result.roadmap,
  });
});

// ==================== Analytics Routes (Phase 5) ====================

// Student analytics dashboard
apiRouter.get('/api/analytics/student', authenticateToken, requireStudent, (req, res) => {
  const student = req.user!;
  const analytics = store.getStudentAnalytics(student.id);
  if (!analytics) {
    return res.status(404).json({ error: 'Student analytics unavailable.' });
  }
  return res.status(200).json({ analytics });
});

// Admin advanced analytics dashboard
apiRouter.get('/api/analytics/admin', authenticateToken, requireAdmin, (_req, res) => {
  const analytics = store.getAdminAnalytics();
  return res.status(200).json({ analytics });
});

// ==================== Admin Career Requirements Management (Phase 5) ====================

// Get requirements for a specific career role
apiRouter.get('/api/admin/careers/:id/skills', authenticateToken, requireAdmin, (req, res) => {
  const careerId = parseInt(req.params.id, 10);
  if (isNaN(careerId)) {
    return res.status(400).json({ error: 'Invalid career ID.' });
  }

  const career = store.getCareerById(careerId);
  if (!career) {
    return res.status(404).json({ error: 'Career role not found.' });
  }

  const roleSkills = store.getRoleSkillsByRoleId(careerId).map((rs) => {
    const skill = store.getSkillById(rs.skill_id);
    return {
      id: rs.id,
      role_id: rs.role_id,
      skill_id: rs.skill_id,
      skill_name: skill?.name || 'Unknown',
      skill_category: skill?.category || 'General',
      required_proficiency: rs.required_proficiency,
      is_core: rs.is_core,
      importance: rs.importance || (rs.is_core ? 'Critical' : 'Important'),
    };
  });

  return res.status(200).json({
    career_id: career.id,
    career_title: career.title,
    requirements: roleSkills,
  });
});

// Add a required skill to a career role
apiRouter.post('/api/admin/careers/:id/skills', authenticateToken, requireAdmin, (req, res) => {
  const careerId = parseInt(req.params.id, 10);
  if (isNaN(careerId)) {
    return res.status(400).json({ error: 'Invalid career ID.' });
  }

  const career = store.getCareerById(careerId);
  if (!career) {
    return res.status(404).json({ error: 'Career role not found.' });
  }

  const { skill_id, required_proficiency, is_core, importance } = req.body;
  const numSkillId = Number(skill_id);
  const numProf = Number(required_proficiency);

  if (isNaN(numSkillId) || !store.getSkillById(numSkillId)) {
    return res.status(400).json({ error: 'Valid skill ID is required.' });
  }

  if (isNaN(numProf) || numProf < 1 || numProf > 5) {
    return res.status(400).json({ error: 'Required proficiency must be between 1 and 5.' });
  }

  const validImportance = ['Critical', 'Important', 'Optional'];
  const resolvedImportance = importance && validImportance.includes(importance)
    ? importance
    : is_core !== undefined && is_core
    ? 'Critical'
    : 'Important';

  const roleSkill = store.addRoleSkill(careerId, {
    skill_id: numSkillId,
    required_proficiency: numProf,
    is_core: resolvedImportance === 'Critical',
    importance: resolvedImportance as 'Critical' | 'Important' | 'Optional',
  });

  const skill = store.getSkillById(numSkillId);

  return res.status(201).json({
    message: 'Career skill requirement added successfully.',
    requirement: {
      id: roleSkill.id,
      role_id: roleSkill.role_id,
      skill_id: roleSkill.skill_id,
      skill_name: skill?.name || 'Unknown',
      skill_category: skill?.category || 'General',
      required_proficiency: roleSkill.required_proficiency,
      is_core: roleSkill.is_core,
      importance: roleSkill.importance,
    },
  });
});

// Update a career requirement
apiRouter.put('/api/admin/careers/:id/skills/:roleSkillId', authenticateToken, requireAdmin, (req, res) => {
  const roleSkillId = parseInt(req.params.roleSkillId, 10);
  if (isNaN(roleSkillId)) {
    return res.status(400).json({ error: 'Invalid role skill ID.' });
  }

  const { required_proficiency, is_core, importance } = req.body;
  const updateData: any = {};

  if (required_proficiency !== undefined) {
    const numProf = Number(required_proficiency);
    if (isNaN(numProf) || numProf < 1 || numProf > 5) {
      return res.status(400).json({ error: 'Required proficiency must be between 1 and 5.' });
    }
    updateData.required_proficiency = numProf;
  }

  if (importance !== undefined) {
    const validImportance = ['Critical', 'Important', 'Optional'];
    if (!validImportance.includes(importance)) {
      return res.status(400).json({ error: 'Invalid importance level.' });
    }
    updateData.importance = importance;
    updateData.is_core = importance === 'Critical';
  } else if (is_core !== undefined) {
    updateData.is_core = !!is_core;
    updateData.importance = is_core ? 'Critical' : 'Important';
  }

  const updated = store.updateRoleSkill(roleSkillId, updateData);
  if (!updated) {
    return res.status(404).json({ error: 'Career requirement not found.' });
  }

  const skill = store.getSkillById(updated.skill_id);

  return res.status(200).json({
    message: 'Career requirement updated successfully.',
    requirement: {
      id: updated.id,
      role_id: updated.role_id,
      skill_id: updated.skill_id,
      skill_name: skill?.name || 'Unknown',
      skill_category: skill?.category || 'General',
      required_proficiency: updated.required_proficiency,
      is_core: updated.is_core,
      importance: updated.importance,
    },
  });
});

// Delete a career requirement
apiRouter.delete('/api/admin/careers/:id/skills/:roleSkillId', authenticateToken, requireAdmin, (req, res) => {
  const roleSkillId = parseInt(req.params.roleSkillId, 10);
  if (isNaN(roleSkillId)) {
    return res.status(400).json({ error: 'Invalid role skill ID.' });
  }

  const deleted = store.deleteRoleSkill(roleSkillId);
  if (!deleted) {
    return res.status(404).json({ error: 'Career requirement not found.' });
  }

  return res.status(200).json({ message: 'Career requirement removed successfully.' });
});

// ==================== Admin Skill Prerequisite Management (Phase 5) ====================

// List all prerequisites
apiRouter.get('/api/admin/prerequisites', authenticateToken, requireAdmin, (_req, res) => {
  const prerequisites = store.getAllPrerequisites();
  return res.status(200).json({ prerequisites });
});

// Add a prerequisite relationship with cycle prevention
apiRouter.post('/api/admin/prerequisites', authenticateToken, requireAdmin, (req, res) => {
  const { skill_id, prerequisite_skill_id } = req.body;
  const numSkillId = Number(skill_id);
  const numPrereqId = Number(prerequisite_skill_id);

  if (isNaN(numSkillId) || isNaN(numPrereqId)) {
    return res.status(400).json({ error: 'Valid skill ID and prerequisite skill ID are required.' });
  }

  const result = store.addPrerequisite(numSkillId, numPrereqId);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const target = store.getSkillById(numSkillId);
  const prereq = store.getSkillById(numPrereqId);

  return res.status(201).json({
    message: 'Prerequisite relationship created successfully.',
    prerequisite: {
      id: result.prerequisite!.id,
      skill_id: numSkillId,
      target_skill_name: target?.name,
      prerequisite_skill_id: numPrereqId,
      prerequisite_skill_name: prereq?.name,
    },
  });
});

// Delete a prerequisite relationship
apiRouter.delete('/api/admin/prerequisites/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid prerequisite ID.' });
  }

  const deleted = store.deletePrerequisite(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Prerequisite relationship not found.' });
  }

  return res.status(200).json({ message: 'Prerequisite relationship removed successfully.' });
});


