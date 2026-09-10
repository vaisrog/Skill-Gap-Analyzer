import { store, User, Skill, LearningResource, RoleSkill } from './store';

export interface SmartRecommendation {
  skill_id: number;
  skill_name: string;
  skill_category: string;
  current_proficiency: number;
  required_proficiency: number;
  skill_gap: number;
  importance: 'Critical' | 'Important' | 'Optional';
  priority_score: number;
  reasons: string[];
  prerequisites: {
    satisfied: boolean;
    all: string[];
    missing: string[];
  };
  learning_resource: {
    id: number;
    title: string;
    url: string;
    resource_type: string;
    difficulty_level: string;
    platform: string | null;
    reason_for_selection: string;
  } | null;
  roadmap_status: 'Not Started' | 'In Progress' | 'Completed' | 'Not in Roadmap';
  roadmap_sequence: number | null;
  estimated_duration: string;
  is_locked: boolean;
  score_breakdown: {
    gap_score: number;
    importance_score: number;
    prerequisite_score: number;
    job_relevance_score: number;
    career_relevance_score: number;
  };
}

export interface RecommendationEngineResult {
  has_target_career: boolean;
  target_career: {
    id: number;
    title: string;
  } | null;
  career_skills_satisfied: boolean;
  top_recommendation: SmartRecommendation | null;
  recommendations: SmartRecommendation[];
  summary: {
    total_recommendations: number;
    ready_to_learn_count: number;
    locked_count: number;
    critical_gaps_count: number;
  };
}

/**
 * Deterministic Smart Priority Score & Recommendation Engine
 *
 * Formula:
 * Priority Score =
 *   Gap Score (gap * 15)
 * + Importance Score (Critical: 35, Important: 20, Optional: 10)
 * + Prerequisite Score (Ready/Satisfied: +25, Foundational for N other skills: +10*N, Missing prereqs: -20)
 * + Job Relevance Score (Mentioned in student's analyzed job postings: +15 if latest, +5 per historical mention)
 * + Career Relevance Score (Core role requirement: +25)
 */
export function generateSmartRecommendations(studentId: number): RecommendationEngineResult {
  const student = store.getUserById(studentId);
  if (!student) {
    return {
      has_target_career: false,
      target_career: null,
      career_skills_satisfied: false,
      top_recommendation: null,
      recommendations: [],
      summary: { total_recommendations: 0, ready_to_learn_count: 0, locked_count: 0, critical_gaps_count: 0 },
    };
  }

  const targetCareer = student.target_career_id ? store.getCareerById(student.target_career_id) : null;
  const studentSkills = store.getStudentSkills(studentId);
  const studentSkillsMap = new Map<number, number>();
  studentSkills.forEach((ss) => studentSkillsMap.set(ss.skill_id, ss.proficiency));

  // Get student roadmap items
  const roadmap = store.getRoadmapByStudentId(studentId);
  const roadmapItems = roadmap ? store.getRoadmapItems(roadmap.id) : [];
  const roadmapItemsMap = new Map<number, (typeof roadmapItems)[0]>();
  roadmapItems.forEach((item) => roadmapItemsMap.set(item.skill_id, item));

  // Get student job analyses to measure market frequency
  const jobAnalyses = store.getJobAnalysesByStudentId(studentId);
  const jobFrequencyMap = new Map<number, number>();
  let latestJobSkillIds = new Set<number>();
  if (jobAnalyses.length > 0) {
    const latest = jobAnalyses[0];
    latest.skills.forEach((s) => latestJobSkillIds.add(s.skill_id));
    jobAnalyses.forEach((ja) => {
      ja.skills.forEach((s) => {
        jobFrequencyMap.set(s.skill_id, (jobFrequencyMap.get(s.skill_id) || 0) + 1);
      });
    });
  }

  // Get master role skills
  let candidateSkills: Array<{
    skill_id: number;
    required_proficiency: number;
    importance: 'Critical' | 'Important' | 'Optional';
    is_core: boolean;
  }> = [];

  if (targetCareer) {
    const roleSkills = store.getRoleSkillsByRoleId(targetCareer.id);
    candidateSkills = roleSkills.map((rs) => ({
      skill_id: rs.skill_id,
      required_proficiency: rs.required_proficiency,
      importance: rs.importance || (rs.is_core ? 'Critical' : 'Important'),
      is_core: rs.is_core,
    }));
  }

  // Also include skills from roadmap that might have been added via Job Analyzer
  roadmapItems.forEach((ri) => {
    if (!candidateSkills.some((cs) => cs.skill_id === ri.skill_id)) {
      candidateSkills.push({
        skill_id: ri.skill_id,
        required_proficiency: ri.required_proficiency,
        importance: ri.importance,
        is_core: ri.importance === 'Critical',
      });
    }
  });

  // Calculate recommendation metrics for each candidate skill
  const evaluatedRecommendations: SmartRecommendation[] = [];

  for (const candidate of candidateSkills) {
    const skill = store.getSkillById(candidate.skill_id);
    if (!skill) continue;

    const currentProficiency = studentSkillsMap.get(skill.id) || 0;
    const requiredProficiency = candidate.required_proficiency;
    const gap = Math.max(0, requiredProficiency - currentProficiency);

    // Roadmap status
    const roadmapItem = roadmapItemsMap.get(skill.id);
    const roadmapStatus = roadmapItem ? roadmapItem.status : 'Not in Roadmap';
    const roadmapSequence = roadmapItem ? roadmapItem.sequence : null;

    // Check prerequisites
    const prereqSkills = store.getPrerequisitesForSkill(skill.id);
    const allPrereqs = prereqSkills.map((p) => p.name);
    const missingPrereqs: string[] = [];

    for (const prereq of prereqSkills) {
      const prereqProf = studentSkillsMap.get(prereq.id) || 0;
      // Incomplete if less than level 2 or incomplete in roadmap
      const prereqRoadmap = roadmapItemsMap.get(prereq.id);
      if (prereqProf < 2 && (!prereqRoadmap || prereqRoadmap.status !== 'Completed')) {
        missingPrereqs.push(prereq.name);
      }
    }

    const satisfiedPrereqs = missingPrereqs.length === 0;
    const isLocked = !satisfiedPrereqs;

    // Check how many other career skills depend on THIS skill
    const allPrerequisites = store.getAllPrerequisites();
    const dependentSkillsCount = allPrerequisites.filter((p) => p.prerequisite_skill_id === skill.id).length;

    // --- Scoring Calculation ---
    // 1. Gap Score (0-75)
    const gapScore = gap * 15;

    // 2. Importance Score (10-35)
    const importanceScore = candidate.importance === 'Critical' ? 35 : candidate.importance === 'Important' ? 20 : 10;

    // 3. Prerequisite Score
    let prereqScore = 0;
    if (satisfiedPrereqs) {
      prereqScore += 25; // Ready to learn immediately!
    } else {
      prereqScore -= 20; // Deprioritize locked items so foundations come first
    }
    prereqScore += Math.min(30, dependentSkillsCount * 10); // Multiplier if foundational for other skills

    // 4. Job Relevance Score (0-30)
    let jobScore = 0;
    if (latestJobSkillIds.has(skill.id)) jobScore += 15;
    const jobFrequency = jobFrequencyMap.get(skill.id) || 0;
    jobScore += Math.min(15, jobFrequency * 5);

    // 5. Career Relevance Score
    const careerScore = candidate.is_core ? 25 : 15;

    // Penalty if already completed in roadmap or zero gap
    let completionMultiplier = 1;
    if (roadmapStatus === 'Completed' || gap === 0) {
      completionMultiplier = 0.05; // Placed at the very bottom
    } else if (roadmapStatus === 'In Progress') {
      completionMultiplier = 1.15; // Bonus for active work
    }

    const totalPriorityScore = Math.round(
      (gapScore + importanceScore + prereqScore + jobScore + careerScore) * completionMultiplier
    );

    // --- Explainable Reasons ---
    const reasons: string[] = [];
    if (targetCareer) {
      reasons.push(`Required benchmark for your target role (${targetCareer.title})`);
    }
    reasons.push(`Current proficiency is Level ${currentProficiency}/5 (Required: Level ${requiredProficiency}/5, Gap: ${gap})`);
    if (candidate.importance === 'Critical') {
      reasons.push('High-priority core requirement');
    }
    if (dependentSkillsCount > 0) {
      reasons.push(`Serves as a foundational prerequisite for ${dependentSkillsCount} other skill(s)`);
    }
    if (satisfiedPrereqs && prereqSkills.length > 0) {
      reasons.push('All foundational prerequisites are completed — ready to study immediately');
    } else if (!satisfiedPrereqs) {
      reasons.push(`Locked pending foundational completion: ${missingPrereqs.join(', ')}`);
    }
    if (jobFrequency > 0) {
      reasons.push(`Identified in ${jobFrequency} real-world job posting(s) you analyzed`);
    }
    if (roadmapStatus === 'In Progress') {
      reasons.push('Currently active in your learning roadmap');
    }

    // --- Learning Resource Intelligence ---
    const resources = store.getResourcesBySkillId(skill.id);
    let selectedResource: SmartRecommendation['learning_resource'] = null;

    if (resources.length > 0) {
      // Pick resource matching current vs target proficiency
      let targetDifficulty = 'Beginner';
      if (currentProficiency >= 3) targetDifficulty = 'Advanced';
      else if (currentProficiency >= 1) targetDifficulty = 'Intermediate';

      const bestResource =
        resources.find((r) => r.difficulty_level.toLowerCase() === targetDifficulty.toLowerCase()) || resources[0];

      selectedResource = {
        id: bestResource.id,
        title: bestResource.title,
        url: bestResource.url,
        resource_type: bestResource.resource_type,
        difficulty_level: bestResource.difficulty_level,
        platform: bestResource.platform,
        reason_for_selection: `Recommended for your current level (${currentProficiency}/5) to reach target (${requiredProficiency}/5).`,
      };
    }

    const estimatedDuration = `${Math.max(1, gap * 2)} weeks`;

    evaluatedRecommendations.push({
      skill_id: skill.id,
      skill_name: skill.name,
      skill_category: skill.category,
      current_proficiency: currentProficiency,
      required_proficiency: requiredProficiency,
      skill_gap: gap,
      importance: candidate.importance,
      priority_score: totalPriorityScore,
      reasons,
      prerequisites: {
        satisfied: satisfiedPrereqs,
        all: allPrereqs,
        missing: missingPrereqs,
      },
      learning_resource: selectedResource,
      roadmap_status: roadmapStatus,
      roadmap_sequence: roadmapSequence,
      estimated_duration: estimatedDuration,
      is_locked: isLocked && gap > 0,
      score_breakdown: {
        gap_score: gapScore,
        importance_score: importanceScore,
        prerequisite_score: prereqScore,
        job_relevance_score: jobScore,
        career_relevance_score: careerScore,
      },
    });
  }

  // Sort descending by priority score
  evaluatedRecommendations.sort((a, b) => b.priority_score - a.priority_score);

  // Check if all career skills are satisfied
  const incompleteGaps = evaluatedRecommendations.filter((r) => r.skill_gap > 0);
  const careerSkillsSatisfied = candidateSkills.length > 0 && incompleteGaps.length === 0;

  // The top recommendation should ideally be an unlocked skill with gap > 0
  const topRecommendation =
    evaluatedRecommendations.find((r) => r.skill_gap > 0 && !r.is_locked) ||
    evaluatedRecommendations.find((r) => r.skill_gap > 0) ||
    evaluatedRecommendations[0] ||
    null;

  return {
    has_target_career: !!targetCareer,
    target_career: targetCareer ? { id: targetCareer.id, title: targetCareer.title } : null,
    career_skills_satisfied: careerSkillsSatisfied,
    top_recommendation: topRecommendation,
    recommendations: evaluatedRecommendations,
    summary: {
      total_recommendations: evaluatedRecommendations.length,
      ready_to_learn_count: evaluatedRecommendations.filter((r) => r.skill_gap > 0 && !r.is_locked).length,
      locked_count: evaluatedRecommendations.filter((r) => r.skill_gap > 0 && r.is_locked).length,
      critical_gaps_count: evaluatedRecommendations.filter((r) => r.skill_gap > 0 && r.importance === 'Critical').length,
    },
  };
}
