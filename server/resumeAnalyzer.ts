import { store, Skill } from './store';
// @ts-ignore
import * as pdfParseModule from 'pdf-parse';
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;

export interface ExtractedResumeData {
  raw_text: string;
  filename: string;
  filesize: number;
  parsed_skills: Array<{
    skill_id: number;
    skill_name: string;
    skill_category: string;
    in_profile: boolean;
    current_proficiency: number;
    in_resume: boolean;
    frequency_in_resume: number;
    context: string;
  }>;
  skills_in_resume_not_in_profile: Array<{
    skill_id: number;
    skill_name: string;
    skill_category: string;
    in_profile: boolean;
    current_proficiency: number;
    in_resume: boolean;
    frequency_in_resume: number;
    context: string;
  }>;
  skills_in_profile_not_in_resume: Array<{
    skill_id: number;
    skill_name: string;
    skill_category: string;
    in_profile: boolean;
    current_proficiency: number;
    in_resume: boolean;
    frequency_in_resume: number;
  }>;
  education_mentions: string[];
  certifications_mentions: string[];
  tools_mentions: string[];
}

export interface JobResumeMatchResult {
  job_analysis_id: number;
  job_title: string;
  company_name: string | null;
  overall_match_percentage: number;
  strong_matches: Array<{
    skill_id: number;
    skill_name: string;
    category: string;
    importance: string;
    in_profile: boolean;
    current_proficiency: number;
  }>;
  missing_from_resume: Array<{
    skill_id: number;
    skill_name: string;
    category: string;
    importance: string;
    in_profile: boolean;
    current_proficiency: number;
  }>;
  recommended_improvements: string[];
}

// Common skill aliases and mappings
const SKILL_ALIASES: Record<string, string> = {
  js: 'JavaScript',
  reactjs: 'React',
  'react.js': 'React',
  ts: 'TypeScript',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  postgres: 'PostgreSQL',
  k8s: 'Kubernetes',
  mongo: 'MongoDB',
  py: 'Python',
  golang: 'Go',
  gcp: 'Google Cloud',
  aws: 'Amazon Web Services',
  azure: 'Microsoft Azure',
  html5: 'HTML',
  css3: 'CSS',
  ml: 'Machine Learning',
  ai: 'Artificial Intelligence',
  nlp: 'Natural Language Processing',
  cv: 'Computer Vision',
  ci_cd: 'CI/CD',
  'ci/cd': 'CI/CD',
  scrum: 'Scrum',
  agile: 'Agile',
};

const COMMON_TOOLS = [
  'git',
  'github',
  'gitlab',
  'docker',
  'kubernetes',
  'postman',
  'jira',
  'confluence',
  'figma',
  'vscode',
  'linux',
  'bash',
  'powershell',
  'jenkins',
  'terraform',
  'webpack',
  'vite',
  'npm',
  'yarn',
];

const EDUCATION_KEYWORDS = [
  'bachelor',
  'b.tech',
  'b.e.',
  'b.s.',
  'bs',
  'bca',
  'master',
  'm.tech',
  'm.s.',
  'ms',
  'mca',
  'ph.d',
  'phd',
  'degree',
  'computer science',
  'information technology',
  'software engineering',
  'data science',
  'electrical engineering',
];

const CERTIFICATION_KEYWORDS = [
  'certified',
  'certification',
  'aws certified',
  'azure certified',
  'google cloud certified',
  'pmp',
  'scrum master',
  'comptia',
  'cisco',
  'ccna',
  'cissp',
  'kubernetes administrator',
  'cka',
];

/**
 * Safely parse text from uploaded file buffer or raw text string
 */
export async function parseResumeText(
  fileBuffer: Buffer | null,
  mimetype: string,
  rawTextInput?: string
): Promise<string> {
  if (rawTextInput && rawTextInput.trim().length > 0) {
    return rawTextInput.trim();
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('No resume file or text provided.');
  }

  // Handle PDF
  if (mimetype.includes('pdf')) {
    try {
      const data = await pdfParse(fileBuffer);
      if (data && data.text && data.text.trim().length > 0) {
        return data.text;
      }
    } catch (e: any) {
      console.warn('pdf-parse encountered an error, attempting text stream fallback:', e?.message);
    }
  }

  // Handle plain text, markdown, docx xml fragments, or fallback string decoding
  const decoded = fileBuffer.toString('utf-8');
  // Strip null bytes and non-printable binary junk if present
  const cleaned = decoded.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
  if (cleaned.trim().length > 20) {
    return cleaned;
  }

  throw new Error('Unable to extract legible text from the uploaded resume file. Please ensure it is a valid PDF or text document.');
}

/**
 * Analyze extracted resume text against system skills and student profile
 */
export function analyzeResumeSkills(
  studentId: number,
  resumeText: string,
  filename: string,
  filesize: number
): ExtractedResumeData {
  const allSkills = store.getAllSkills();
  const studentSkills = store.getStudentSkills(studentId);
  const studentSkillsMap = new Map<number, number>();
  studentSkills.forEach((ss) => studentSkillsMap.set(ss.skill_id, ss.proficiency));

  const lowerText = resumeText.toLowerCase();

  const foundSkillsMap = new Map<
    number,
    {
      skill: Skill;
      count: number;
      context: string;
    }
  >();

  // 1. Check all canonical skills in the database
  for (const skill of allSkills) {
    const skillNameLower = skill.name.toLowerCase();
    // Escape regex special chars
    const escaped = skillNameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Word boundary match
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+.-])${escaped}(?:[^a-zA-Z0-9#+.-]|$)`, 'gi');
    const matches = lowerText.match(regex);

    if (matches && matches.length > 0) {
      // Find sample context sentence
      const index = lowerText.indexOf(skillNameLower);
      const start = Math.max(0, index - 40);
      const end = Math.min(resumeText.length, index + skillNameLower.length + 50);
      const context = resumeText.substring(start, end).replace(/\s+/g, ' ').trim();

      foundSkillsMap.set(skill.id, {
        skill,
        count: matches.length,
        context: context ? `...${context}...` : '',
      });
    }
  }

  // 2. Check skill aliases
  for (const [alias, canonicalName] of Object.entries(SKILL_ALIASES)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+.-])${escaped}(?:[^a-zA-Z0-9#+.-]|$)`, 'gi');
    const matches = lowerText.match(regex);

    if (matches && matches.length > 0) {
      const canonicalSkill = allSkills.find((s) => s.name.toLowerCase() === canonicalName.toLowerCase());
      if (canonicalSkill && !foundSkillsMap.has(canonicalSkill.id)) {
        const index = lowerText.indexOf(alias);
        const start = Math.max(0, index - 40);
        const end = Math.min(resumeText.length, index + alias.length + 50);
        const context = resumeText.substring(start, end).replace(/\s+/g, ' ').trim();

        foundSkillsMap.set(canonicalSkill.id, {
          skill: canonicalSkill,
          count: matches.length,
          context: context ? `...${context}...` : '',
        });
      }
    }
  }

  // 3. Extract Tools mentions
  const toolsFound: string[] = [];
  for (const tool of COMMON_TOOLS) {
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${tool}(?:[^a-zA-Z0-9]|$)`, 'i');
    if (regex.test(lowerText)) {
      toolsFound.push(tool.toUpperCase() === 'GIT' ? 'Git' : tool.charAt(0).toUpperCase() + tool.slice(1));
    }
  }

  // 4. Extract Education mentions
  const lines = resumeText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const educationMentions: string[] = [];
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (EDUCATION_KEYWORDS.some((kw) => lowerLine.includes(kw)) && line.length < 120) {
      if (!educationMentions.includes(line)) {
        educationMentions.push(line);
      }
    }
  }

  // 5. Extract Certifications mentions
  const certificationsMentions: string[] = [];
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (CERTIFICATION_KEYWORDS.some((kw) => lowerLine.includes(kw)) && line.length < 140) {
      if (!certificationsMentions.includes(line)) {
        certificationsMentions.push(line);
      }
    }
  }

  // Format skill matches
  const parsedSkills = Array.from(foundSkillsMap.values()).map((item) => {
    const inProfile = studentSkillsMap.has(item.skill.id);
    const prof = studentSkillsMap.get(item.skill.id) || 0;
    return {
      skill_id: item.skill.id,
      skill_name: item.skill.name,
      skill_category: item.skill.category,
      in_profile: inProfile,
      current_proficiency: prof,
      in_resume: true,
      frequency_in_resume: item.count,
      context: item.context,
    };
  });

  // Skills in resume but NOT in student profile
  const skillsInResumeNotInProfile = parsedSkills.filter((ps) => !ps.in_profile);

  // Skills in profile but NOT found in resume
  const skillsInProfileNotInResume = studentSkills
    .filter((ss) => !foundSkillsMap.has(ss.skill_id))
    .map((ss) => {
      const sk = store.getSkillById(ss.skill_id);
      return {
        skill_id: ss.skill_id,
        skill_name: sk ? sk.name : 'Unknown',
        skill_category: sk ? sk.category : 'General',
        in_profile: true,
        current_proficiency: ss.proficiency,
        in_resume: false,
        frequency_in_resume: 0,
      };
    });

  return {
    raw_text: resumeText,
    filename,
    filesize,
    parsed_skills: parsedSkills,
    skills_in_resume_not_in_profile: skillsInResumeNotInProfile,
    skills_in_profile_not_in_resume: skillsInProfileNotInResume,
    education_mentions: educationMentions.slice(0, 5),
    certifications_mentions: certificationsMentions.slice(0, 6),
    tools_mentions: Array.from(new Set(toolsFound)),
  };
}

/**
 * Cross-match latest resume skills against an analyzed job description
 */
export function matchResumeWithJob(
  studentId: number,
  jobAnalysisId: number
): JobResumeMatchResult {
  const jobAnalysis = store.getJobAnalysisById(jobAnalysisId, studentId);
  if (!jobAnalysis) {
    throw new Error('Job description analysis record not found.');
  }

  const latestResume = store.getLatestResumeAnalysis(studentId);
  if (!latestResume) {
    throw new Error('No uploaded resume found. Please analyze your resume first.');
  }

  const studentSkills = store.getStudentSkills(studentId);
  const studentSkillsMap = new Map<number, number>();
  studentSkills.forEach((ss) => studentSkillsMap.set(ss.skill_id, ss.proficiency));

  const resumeSkillIds = new Set(latestResume.parsed_skills.map((s) => s.skill_id));

  const strongMatches = [];
  const missingFromResume = [];

  for (const jobSkill of jobAnalysis.skills) {
    const inResume = resumeSkillIds.has(jobSkill.skill_id);
    const inProfile = studentSkillsMap.has(jobSkill.skill_id);
    const currentProf = studentSkillsMap.get(jobSkill.skill_id) || 0;

    const item = {
      skill_id: jobSkill.skill_id,
      skill_name: jobSkill.skill_name,
      category: jobSkill.skill_category,
      importance: jobSkill.importance,
      in_profile: inProfile,
      current_proficiency: currentProf,
    };

    if (inResume) {
      strongMatches.push(item);
    } else {
      missingFromResume.push(item);
    }
  }

  const totalJobSkills = jobAnalysis.skills.length;
  const overallMatch = totalJobSkills > 0 ? Math.round((strongMatches.length / totalJobSkills) * 100) : 0;

  // Generate ethical, actionable suggestions
  const recommendedImprovements: string[] = [];
  const criticalMissing = missingFromResume.filter((m) => m.importance === 'Critical');

  if (criticalMissing.length > 0) {
    criticalMissing.slice(0, 3).forEach((m) => {
      recommendedImprovements.push(
        `Highlight experience or projects using ${m.skill_name} if you have practical familiarity with it (Add only if you genuinely have this skill/experience).`
      );
    });
  }

  if (strongMatches.length > 0) {
    const topMatch = strongMatches[0];
    recommendedImprovements.push(
      `Showcase your ${topMatch.skill_name} achievements prominently in your bullet points to match the job requirement.`
    );
  }

  if (missingFromResume.some((m) => m.in_profile)) {
    const inProfileMissing = missingFromResume.filter((m) => m.in_profile);
    recommendedImprovements.push(
      `You have logged ${inProfileMissing.map((m) => m.skill_name).slice(0, 2).join(' & ')} in your profile, but they are not clearly mentioned in your resume text.`
    );
  }

  return {
    job_analysis_id: jobAnalysis.id,
    job_title: jobAnalysis.job_title,
    company_name: jobAnalysis.company,
    overall_match_percentage: overallMatch,
    strong_matches: strongMatches,
    missing_from_resume: missingFromResume,
    recommended_improvements: recommendedImprovements,
  };
}
