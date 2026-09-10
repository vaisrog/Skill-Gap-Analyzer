import { store, User, RoleSkill } from './store';

export const PROFICIENCY_LABELS: Record<number, string> = {
  0: 'No Knowledge',
  1: 'Beginner',
  2: 'Basic',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export const IMPORTANCE_WEIGHTS = {
  Critical: 5,
  Important: 3,
  Optional: 1,
};

function getImportanceFor(roleSkill: RoleSkill): { importance: 'Critical' | 'Important' | 'Optional'; weight: number } {
  if (roleSkill.is_core === true) {
    return { importance: 'Critical', weight: IMPORTANCE_WEIGHTS.Critical };
  }
  if (roleSkill.is_core === false) {
    return { importance: 'Important', weight: IMPORTANCE_WEIGHTS.Important };
  }
  return { importance: 'Optional', weight: IMPORTANCE_WEIGHTS.Optional };
}

function getGapStatus(gap: number): 'No Gap' | 'Minor Gap' | 'Moderate Gap' | 'Major Gap' {
  if (gap === 0) return 'No Gap';
  if (gap === 1) return 'Minor Gap';
  if (gap === 2) return 'Moderate Gap';
  return 'Major Gap';
}

function getReadinessClassification(score: number): 'Highly Ready' | 'Developing' | 'Needs Improvement' | 'Beginner' {
  if (score >= 80) return 'Highly Ready';
  if (score >= 60) return 'Developing';
  if (score >= 40) return 'Needs Improvement';
  return 'Beginner';
}

function getPriorityReason(item: any, careerTitle: string): string {
  const currentLabel = PROFICIENCY_LABELS[item.current_proficiency];
  const requiredLabel = PROFICIENCY_LABELS[item.required_proficiency];
  if (item.current_proficiency === 0) {
    return (
      `You currently have no proficiency in ${item.skill_name}, while ` +
      `${careerTitle} requires ${requiredLabel.toLowerCase()} proficiency. ` +
      `It is a ${item.importance.toLowerCase()} requirement.`
    );
  }
  return (
    `Your current level is ${currentLabel.toLowerCase()}, while ` +
    `${careerTitle} requires ${requiredLabel.toLowerCase()} proficiency. ` +
    `This is a ${item.importance.toLowerCase()} requirement with a ${item.status.toLowerCase()}.`
  );
}

export function buildSkillGapAnalysis(student: User): { analysis: any | null; errorCode: string | null } {
  if (!student.target_career_id) {
    return { analysis: null, errorCode: 'no_target_career' };
  }

  const career = store.getCareerById(student.target_career_id);
  if (!career) {
    return { analysis: null, errorCode: 'no_target_career' };
  }

  const roleSkills = store.roleSkills.filter((rs) => rs.role_id === career.id);
  if (!roleSkills.length) {
    return { analysis: null, errorCode: 'no_career_requirements' };
  }

  const studentSkills = store.getStudentSkills(student.id);
  const currentSkillsMap = new Map<number, number>();
  for (const ss of studentSkills) {
    currentSkillsMap.set(ss.skill_id, ss.proficiency);
  }

  const skillAnalysis: any[] = [];
  let weightedMatchTotal = 0.0;
  let weightTotal = 0;

  for (const requirement of roleSkills) {
    const skill = store.getSkillById(requirement.skill_id);
    const required = Math.max(0, Math.min(5, requirement.required_proficiency));
    const current = Math.max(0, Math.min(5, currentSkillsMap.get(requirement.skill_id) ?? 0));
    const gap = Math.max(required - current, 0);
    const { importance, weight } = getImportanceFor(requirement);
    const matchRatio = required > 0 ? Math.min(current, required) / required : 1;

    weightedMatchTotal += weight * matchRatio;
    weightTotal += weight;

    skillAnalysis.push({
      skill_id: requirement.skill_id,
      skill_name: skill ? skill.name : 'Unknown skill',
      skill_category: skill ? skill.category : null,
      current_proficiency: current,
      current_proficiency_label: PROFICIENCY_LABELS[current],
      required_proficiency: required,
      required_proficiency_label: PROFICIENCY_LABELS[required],
      skill_gap: gap,
      status: getGapStatus(gap),
      importance,
      importance_weight: weight,
      is_missing: current === 0,
      is_absent_from_profile: !currentSkillsMap.has(requirement.skill_id),
      priority_score: gap * weight + (current === 0 && gap > 0 ? weight : 0),
    });
  }

  const gaps = skillAnalysis.filter((item) => item.skill_gap > 0);
  gaps.sort((a, b) => {
    if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
    if (b.skill_gap !== a.skill_gap) return b.skill_gap - a.skill_gap;
    return a.skill_name.localeCompare(b.skill_name);
  });

  gaps.forEach((item, index) => {
    item.priority_rank = index + 1;
    item.recommendation_reason = getPriorityReason(item, career.title);
  });

  skillAnalysis.forEach((item) => {
    if (item.skill_gap === 0) {
      item.priority_rank = null;
      item.recommendation_reason = null;
    }
  });

  const readinessScore = weightTotal > 0 ? Math.round((weightedMatchTotal / weightTotal) * 100) : 0;
  const strengths = skillAnalysis.filter((item) => item.skill_gap === 0);
  const missingSkills = skillAnalysis.filter((item) => item.is_missing);
  const majorGaps = gaps.filter((item) => item.skill_gap >= 3);

  const statusCounts = {
    'No Gap': skillAnalysis.filter((item) => item.status === 'No Gap').length,
    'Minor Gap': skillAnalysis.filter((item) => item.status === 'Minor Gap').length,
    'Moderate Gap': skillAnalysis.filter((item) => item.status === 'Moderate Gap').length,
    'Major Gap': skillAnalysis.filter((item) => item.status === 'Major Gap').length,
  };

  const analysis = {
    target_career: {
      id: career.id,
      title: career.title,
      description: career.description,
      category: career.category,
    },
    readiness_score: readinessScore,
    readiness_classification: getReadinessClassification(readinessScore),
    calculation: {
      method: 'weighted requirement satisfaction',
      importance_weights: IMPORTANCE_WEIGHTS,
      note: 'This estimated skill match score is not a guarantee of employment or job qualification.',
    },
    summary: {
      total_required_skills: skillAnalysis.length,
      skills_satisfied: strengths.length,
      skills_requiring_improvement: gaps.length,
      missing_skills: missingSkills.length,
      status_counts: statusCounts,
    },
    recommended_next_skill: gaps.length > 0 ? gaps[0] : null,
    priority_skills: gaps.slice(0, 5),
    skill_gaps: gaps,
    strengths,
    major_gaps: majorGaps,
    missing_skills: missingSkills,
    skill_analysis: skillAnalysis,
    warnings: studentSkills.length === 0 ? ['no_skills_added'] : [],
  };

  return { analysis, errorCode: null };
}
