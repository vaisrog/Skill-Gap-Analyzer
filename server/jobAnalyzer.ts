import { store, Skill, User } from './store';

export interface ExtractedJobSkill {
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

export interface JobAnalysisResult {
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
  skills: ExtractedJobSkill[];
  strengths: ExtractedJobSkill[];
  skill_gaps: ExtractedJobSkill[];
  missing_skills: ExtractedJobSkill[];
  major_gaps: ExtractedJobSkill[];
  priority_skills: ExtractedJobSkill[];
  recommended_next_skills: Array<{
    skill_name: string;
    importance: string;
    gap: number;
    reason: string;
  }>;
}

// Comprehensive dictionary of skill aliases to known skill names
const SKILL_ALIASES: Record<string, string[]> = {
  'Python': ['python', 'python3', 'python 3', 'python programming', 'py'],
  'SQL': ['sql', 'structured query language', 'mysql', 'postgresql', 'postgres', 'sqlite', 't-sql', 'pl/sql', 'nosql', 'rdbms'],
  'JavaScript': ['javascript', 'js', 'ecmascript', 'es6', 'typescript', 'ts'],
  'React': ['react', 'reactjs', 'react.js', 'react js', 'react native', 'redux'],
  'Node.js': ['node', 'nodejs', 'node.js', 'node js', 'express.js', 'expressjs'],
  'HTML & CSS': ['html', 'css', 'html5', 'css3', 'html/css', 'html & css', 'sass', 'tailwind', 'bootstrap'],
  'Database Design': ['database design', 'data modeling', 'database modeling', 'schema design', 'normalization', 'er diagram', 'relational design'],
  'Data Visualization': ['data visualization', 'data viz', 'tableau', 'matplotlib', 'seaborn', 'd3', 'd3.js', 'looker'],
  'Statistics & Probability': ['statistics', 'probability', 'statistical modeling', 'statistical analysis', 'hypothesis testing', 'a/b testing', 'regression analysis'],
  'Excel & Spreadsheet Modeling': ['excel', 'ms excel', 'microsoft excel', 'spreadsheet modeling', 'advanced excel', 'vlookup', 'pivot tables', 'google sheets'],
  'Pandas': ['pandas', 'pd'],
  'NumPy': ['numpy', 'np'],
  'Power BI': ['power bi', 'powerbi', 'ms power bi', 'microsoft power bi', 'dax'],
  'Java': ['java', 'core java', 'j2ee', 'spring boot', 'spring framework'],
  'Git & CI/CD': ['git', 'github', 'gitlab', 'ci/cd', 'cicd', 'version control', 'continuous integration', 'jenkins', 'actions'],
  'Linux System Administration': ['linux', 'unix', 'ubuntu', 'centos', 'redhat', 'bash', 'shell scripting', 'system administration', 'sysadmin'],
  'Network Security': ['network security', 'firewalls', 'vpn', 'ids', 'ips', 'perimeter security'],
  'Incident Response': ['incident response', 'incident handling', 'soc', 'soc analyst', 'threat detection', 'forensics'],
  'Ethical Hacking & Penetration Testing': ['ethical hacking', 'penetration testing', 'pen testing', 'pentesting', 'vulnerability assessment', 'metasploit', 'burp suite'],
  'Cryptography & PKI': ['cryptography', 'pki', 'encryption', 'tls', 'ssl', 'ciphers'],
  'Networking': ['networking', 'tcp/ip', 'dns', 'routing', 'switching', 'dhcp', 'osi model', 'subnets'],
  'SIEM': ['siem', 'splunk', 'qradar', 'sentinel', 'security information and event management', 'log analysis'],
  'Security Tools': ['security tools', 'wireshark', 'nmap', 'nessus', 'vulnerability scanner'],
  'Data Structures & Algorithms': ['data structures', 'dsa', 'data structures and algorithms'],
  'Object-Oriented Design': ['object-oriented', 'oop', 'ood', 'object oriented design', 'design patterns', 'solid principles'],
  'REST APIs': ['rest api', 'rest apis', 'restful', 'restful api', 'api integration', 'web services', 'graphql', 'endpoints'],
  'Programming Fundamentals': ['programming fundamentals', 'software engineering', 'computer science fundamentals', 'clean code', 'debugging'],
  'Algorithms': ['algorithms', 'algorithmic problem solving', 'dynamic programming', 'graph algorithms'],
  'Machine Learning & Scikit-Learn': ['machine learning', 'ml', 'scikit-learn', 'sklearn', 'predictive modeling', 'classification', 'clustering'],
  'Deep Learning & PyTorch': ['deep learning', 'pytorch', 'tensorflow', 'keras', 'neural networks', 'cnn', 'rnn', 'transformers', 'llm', 'nlp'],
};

/**
 * Normalizes text for regex matching
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts skills, requirement levels, and importance from freeform job description.
 */
export function extractSkillsFromJobDescription(
  jobDescription: string,
  studentUser: User
): JobAnalysisResult {
  const allMasterSkills = store.skills;
  const studentSkills = store.getStudentSkills(studentUser.id);
  const studentSkillMap = new Map<number, number>();
  studentSkills.forEach((ss) => studentSkillMap.set(ss.skill_id, ss.proficiency));

  const textLower = jobDescription.toLowerCase();

  // Track matched master skill IDs
  const matchedSkillMap = new Map<number, {
    skill: Skill;
    detectedLevel: number;
    isEstimated: boolean;
    importance: 'Critical' | 'Important' | 'Optional';
  }>();

  for (const skill of allMasterSkills) {
    const aliases = SKILL_ALIASES[skill.name] || [skill.name.toLowerCase()];
    // Combine skill name itself and aliases
    const searchTerms = Array.from(new Set([skill.name.toLowerCase(), ...aliases]));

    let foundMatch = false;
    let matchContext = '';

    for (const term of searchTerms) {
      // Use boundary-safe regex matching
      const pattern = new RegExp(`(?:^|[^a-zA-Z0-9+#_])${escapeRegex(term)}(?:$|[^a-zA-Z0-9+#_])`, 'i');
      const match = pattern.exec(jobDescription);
      if (match) {
        foundMatch = true;
        const matchIdx = match.index;
        const start = Math.max(0, matchIdx - 120);
        const end = Math.min(jobDescription.length, matchIdx + term.length + 120);
        matchContext = jobDescription.slice(start, end).toLowerCase();
        break;
      }
    }

    if (foundMatch) {
      // 1. Detect proficiency level from contextual cues
      let detectedLevel = 3; // sensible default
      let isEstimated = true;

      if (
        matchContext.includes('expert') ||
        matchContext.includes('mastery') ||
        matchContext.includes('architect') ||
        matchContext.includes('principal') ||
        matchContext.includes('lead') ||
        /\b(?:[7-9]|10)\+?\s*years?\b/.test(matchContext)
      ) {
        detectedLevel = 5;
        isEstimated = false;
      } else if (
        matchContext.includes('advanced') ||
        matchContext.includes('proficient') ||
        matchContext.includes('strong knowledge') ||
        matchContext.includes('solid understanding') ||
        matchContext.includes('hands-on experience') ||
        matchContext.includes('in-depth') ||
        /\b(?:[4-6])\+?\s*years?\b/.test(matchContext)
      ) {
        detectedLevel = 4;
        isEstimated = false;
      } else if (
        matchContext.includes('intermediate') ||
        matchContext.includes('working knowledge') ||
        matchContext.includes('experience in') ||
        matchContext.includes('experience with') ||
        /\b(?:[2-3])\+?\s*years?\b/.test(matchContext)
      ) {
        detectedLevel = 3;
        isEstimated = false;
      } else if (
        matchContext.includes('beginner') ||
        matchContext.includes('basic knowledge') ||
        matchContext.includes('familiarity') ||
        matchContext.includes('exposure to') ||
        matchContext.includes('entry level') ||
        matchContext.includes('foundational') ||
        /\b(?:0|1)\+?\s*years?\b/.test(matchContext)
      ) {
        detectedLevel = 2;
        isEstimated = false;
      }

      // 2. Detect importance
      let importance: 'Critical' | 'Important' | 'Optional' = 'Important';
      if (
        matchContext.includes('must have') ||
        matchContext.includes('required') ||
        matchContext.includes('essential') ||
        matchContext.includes('minimum qualification') ||
        matchContext.includes('key requirement')
      ) {
        importance = 'Critical';
      } else if (
        matchContext.includes('nice to have') ||
        matchContext.includes('plus') ||
        matchContext.includes('bonus') ||
        matchContext.includes('preferred') ||
        matchContext.includes('optional') ||
        matchContext.includes('advantage')
      ) {
        importance = 'Optional';
      }

      matchedSkillMap.set(skill.id, {
        skill,
        detectedLevel,
        isEstimated,
        importance,
      });
    }
  }

  // Build extracted skills list
  const extractedSkills: ExtractedJobSkill[] = [];
  const importanceWeights = { Critical: 5, Important: 3, Optional: 1 };
  let totalMaxScore = 0;
  let totalEarnedScore = 0;

  for (const [skillId, matchData] of matchedSkillMap.entries()) {
    const studentLevel = studentSkillMap.get(skillId) ?? 0;
    const reqLevel = matchData.detectedLevel;
    const gap = Math.max(0, reqLevel - studentLevel);

    let status: 'Match' | 'Minor Gap' | 'Moderate Gap' | 'Major Gap' | 'Missing';
    if (studentLevel === 0) {
      status = 'Missing';
    } else if (studentLevel >= reqLevel) {
      status = 'Match';
    } else if (gap >= 3) {
      status = 'Major Gap';
    } else if (gap === 2) {
      status = 'Moderate Gap';
    } else {
      status = 'Minor Gap';
    }

    const weight = importanceWeights[matchData.importance];
    totalMaxScore += reqLevel * weight;
    totalEarnedScore += Math.min(studentLevel, reqLevel) * weight;

    extractedSkills.push({
      skill_id: skillId,
      skill_name: matchData.skill.name,
      skill_category: matchData.skill.category,
      required_proficiency: reqLevel,
      student_proficiency: studentLevel,
      skill_gap: gap,
      status,
      is_core: matchData.importance === 'Critical',
      importance: matchData.importance,
      is_estimated: matchData.isEstimated,
    });
  }

  // Sort extracted skills logically: gaps first (highest gap & critical importance first), then matches
  extractedSkills.sort((a, b) => {
    if (a.skill_gap !== b.skill_gap) {
      return b.skill_gap - a.skill_gap;
    }
    const weightA = importanceWeights[a.importance];
    const weightB = importanceWeights[b.importance];
    return weightB - weightA;
  });

  const matchScore = totalMaxScore > 0 ? Math.round((totalEarnedScore / totalMaxScore) * 100) : 0;

  let readinessClassification: 'Highly Ready' | 'Developing' | 'Needs Improvement' | 'Beginner';
  if (matchScore >= 80) readinessClassification = 'Highly Ready';
  else if (matchScore >= 60) readinessClassification = 'Developing';
  else if (matchScore >= 40) readinessClassification = 'Needs Improvement';
  else readinessClassification = 'Beginner';

  const strengths = extractedSkills.filter((s) => s.status === 'Match');
  const skillGaps = extractedSkills.filter((s) => s.skill_gap > 0);
  const missingSkills = extractedSkills.filter((s) => s.status === 'Missing');
  const majorGaps = extractedSkills.filter((s) => s.status === 'Major Gap');

  // Priority skills for improvement: largest gaps + critical importance
  const prioritySkills = [...skillGaps].sort((a, b) => {
    const priorityA = a.skill_gap * importanceWeights[a.importance] + (a.status === 'Missing' ? 2 : 0);
    const priorityB = b.skill_gap * importanceWeights[b.importance] + (b.status === 'Missing' ? 2 : 0);
    return priorityB - priorityA;
  });

  // Actionable recommendations: top 3 skills to improve
  const recommendedNextSkills = prioritySkills.slice(0, 3).map((item) => {
    let reason = '';
    if (item.status === 'Missing' && item.importance === 'Critical') {
      reason = `Essential skill required at level ${item.required_proficiency}. You currently have no proficiency recorded for this role requirement.`;
    } else if (item.status === 'Major Gap') {
      reason = `Significant gap of ${item.skill_gap} levels on a high-value skill. Closing this will substantially boost your job readiness.`;
    } else if (item.importance === 'Critical') {
      reason = `Core requirement for this position with an active ${item.status.toLowerCase()}.`;
    } else {
      reason = `Targeted improvement skill (gap of ${item.skill_gap}) that strengthens your technical profile for this opening.`;
    }

    return {
      skill_name: item.skill_name,
      importance: item.importance,
      gap: item.skill_gap,
      reason,
    };
  });

  return {
    job_title: '',
    company: '',
    job_description: jobDescription,
    match_score: matchScore,
    readiness_classification: readinessClassification,
    identified_skills_count: extractedSkills.length,
    skills_satisfied_count: strengths.length,
    skills_gap_count: skillGaps.length,
    missing_skills_count: missingSkills.length,
    major_gaps_count: majorGaps.length,
    skills: extractedSkills,
    strengths,
    skill_gaps: skillGaps,
    missing_skills: missingSkills,
    major_gaps: majorGaps,
    priority_skills: prioritySkills,
    recommended_next_skills: recommendedNextSkills,
  };
}
