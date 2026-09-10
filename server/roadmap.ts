import { store, User, Roadmap, RoadmapItem, Skill } from './store';
import { PROFICIENCY_LABELS } from './analysis';

export interface GenerateRoadmapResult {
  roadmap: Roadmap | null;
  items: RoadmapItem[];
  recommendedNextSkill: RoadmapItem | null;
  targetCareer: any | null;
  emptyState: 'no_target_career' | 'no_career_requirements' | 'all_skills_satisfied' | null;
  summary: {
    total_skills_in_roadmap: number;
    completed_skills: number;
    in_progress_skills: number;
    not_started_skills: number;
    overall_completion: number;
  };
}

/**
 * Derives a structured topic name for a skill gap.
 */
function deriveTopicName(skillName: string, current: number, required: number): string {
  if (current === 0) {
    if (required >= 4) return `${skillName} Fundamentals & Advanced Core`;
    if (required === 3) return `${skillName} Foundations & Application`;
    return `${skillName} Core Basics`;
  }
  if (current === 1) {
    return `Practical & Intermediate ${skillName}`;
  }
  if (current === 2) {
    return `Advanced ${skillName} Architecture`;
  }
  return `Mastery & Expert Applications in ${skillName}`;
}

/**
 * Determines estimated learning difficulty.
 */
function deriveDifficulty(current: number, required: number): string {
  if (required <= 2) return 'Beginner';
  if (current <= 1 && required <= 3) return 'Beginner → Intermediate';
  if (current <= 1 && required >= 4) return 'Beginner → Advanced';
  if (current >= 2 && required <= 4) return 'Intermediate';
  return 'Advanced';
}

/**
 * Calculates estimated duration in realistic study weeks.
 */
function deriveDuration(gap: number, required: number): string {
  const weeks = Math.max(1, gap * 2);
  return `${weeks} week${weeks > 1 ? 's' : ''}`;
}

/**
 * Builds or refreshes the deterministic, prerequisite-aware Personalized Learning Roadmap.
 */
export function generateOrGetStudentRoadmap(student: User, forceRegenerate = false): GenerateRoadmapResult {
  const defaultSummary = {
    total_skills_in_roadmap: 0,
    completed_skills: 0,
    in_progress_skills: 0,
    not_started_skills: 0,
    overall_completion: 0,
  };

  // 1. Check target career
  if (!student.target_career_id) {
    return {
      roadmap: null,
      items: [],
      recommendedNextSkill: null,
      targetCareer: null,
      emptyState: 'no_target_career',
      summary: defaultSummary,
    };
  }

  const career = store.getCareerById(student.target_career_id);
  if (!career) {
    return {
      roadmap: null,
      items: [],
      recommendedNextSkill: null,
      targetCareer: null,
      emptyState: 'no_target_career',
      summary: defaultSummary,
    };
  }

  // 2. Check career skill requirements
  const roleSkills = store.roleSkills.filter((rs) => rs.role_id === career.id);
  if (roleSkills.length === 0) {
    return {
      roadmap: null,
      items: [],
      recommendedNextSkill: null,
      targetCareer: career,
      emptyState: 'no_career_requirements',
      summary: defaultSummary,
    };
  }

  // 3. Get student skills and calculate skill gaps
  const studentSkills = store.getStudentSkills(student.id);
  const studentSkillMap = new Map<number, number>();
  for (const ss of studentSkills) {
    studentSkillMap.set(ss.skill_id, ss.proficiency);
  }

  interface CandidateSkill {
    skill: Skill;
    required_proficiency: number;
    current_proficiency: number;
    skill_gap: number;
    importance: 'Critical' | 'Important' | 'Optional';
    is_core: boolean;
  }

  const candidates: CandidateSkill[] = [];

  for (const rs of roleSkills) {
    const skill = store.getSkillById(rs.skill_id);
    if (!skill) continue;

    const current = studentSkillMap.get(skill.id) ?? 0;
    const required = rs.required_proficiency;
    const gap = required - current;

    // Only include skills that require improvement
    if (gap > 0) {
      candidates.push({
        skill,
        required_proficiency: required,
        current_proficiency: current,
        skill_gap: gap,
        importance: rs.is_core ? 'Critical' : 'Important',
        is_core: rs.is_core,
      });
    }
  }

  // If no skill gaps exist, student meets all requirements
  if (candidates.length === 0) {
    return {
      roadmap: null,
      items: [],
      recommendedNextSkill: null,
      targetCareer: career,
      emptyState: 'all_skills_satisfied',
      summary: {
        total_skills_in_roadmap: 0,
        completed_skills: 0,
        in_progress_skills: 0,
        not_started_skills: 0,
        overall_completion: 100,
      },
    };
  }

  // 4. Prerequisite & Dependency Aware Sequencing (Topological Sort with Priority Tie-Breaking)
  const candidateIdSet = new Set(candidates.map((c) => c.skill.id));
  const candidateMap = new Map<number, CandidateSkill>();
  for (const c of candidates) {
    candidateMap.set(c.skill.id, c);
  }

  // Build prerequisite adjacency graph among candidates
  // dependencies: map from skillId -> Set of candidate skills that must be learned BEFORE skillId
  const dependencies = new Map<number, Set<number>>();
  for (const c of candidates) {
    const prereqIds = store.getPrerequisiteIdsForSkill(c.skill.id);
    const candidatePrereqs = new Set<number>();
    for (const pid of prereqIds) {
      if (candidateIdSet.has(pid)) {
        candidatePrereqs.add(pid);
      }
    }
    dependencies.set(c.skill.id, candidatePrereqs);
  }

  // Deterministic Topological Sort
  const sequencedCandidates: CandidateSkill[] = [];
  const remainingIds = new Set<number>(candidateIdSet);
  const completedInSort = new Set<number>();

  while (remainingIds.size > 0) {
    // Find all remaining skills whose prerequisites have been sequenced
    const available: CandidateSkill[] = [];
    for (const id of remainingIds) {
      const neededPrereqs = dependencies.get(id)!;
      let allSatisfied = true;
      for (const p of neededPrereqs) {
        if (!completedInSort.has(p)) {
          allSatisfied = false;
          break;
        }
      }
      if (allSatisfied) {
        available.push(candidateMap.get(id)!);
      }
    }

    // Fallback in case of an unexpected cycle: pick the one with fewest unsatisfied prerequisites
    if (available.length === 0) {
      let minUnsatisfied = Infinity;
      let fallbackCandidate: CandidateSkill | null = null;
      for (const id of remainingIds) {
        const needed = dependencies.get(id)!;
        let count = 0;
        for (const p of needed) {
          if (!completedInSort.has(p)) count++;
        }
        if (count < minUnsatisfied) {
          minUnsatisfied = count;
          fallbackCandidate = candidateMap.get(id)!;
        }
      }
      if (fallbackCandidate) {
        available.push(fallbackCandidate);
      }
    }

    // Sort available candidates by priority:
    // 1. Importance (Critical > Important)
    // 2. Skill Gap descending (larger gaps first)
    // 3. Lower required proficiency (foundational steps first)
    // 4. Alphabetical skill name for deterministic tie-breaking
    available.sort((a, b) => {
      const impWeight = (c: CandidateSkill) => (c.is_core ? 2 : 1);
      if (impWeight(b) !== impWeight(a)) {
        return impWeight(b) - impWeight(a);
      }
      if (b.skill_gap !== a.skill_gap) {
        return b.skill_gap - a.skill_gap;
      }
      if (a.required_proficiency !== b.required_proficiency) {
        return a.required_proficiency - b.required_proficiency;
      }
      return a.skill.name.localeCompare(b.skill.name);
    });

    const chosen = available[0];
    sequencedCandidates.push(chosen);
    completedInSort.add(chosen.skill.id);
    remainingIds.delete(chosen.skill.id);
  }

  // 5. Progress Preservation across regenerations
  const existingRoadmap = store.getRoadmapByStudentId(student.id);
  const previousProgressMap = new Map<number, { status: 'Not Started' | 'In Progress' | 'Completed'; completion_percentage: number }>();

  if (existingRoadmap && existingRoadmap.career_id === career.id) {
    const existingItems = store.getRoadmapItems(existingRoadmap.id);
    for (const it of existingItems) {
      previousProgressMap.set(it.skill_id, {
        status: it.status,
        completion_percentage: it.completion_percentage,
      });
    }
  }

  // 6. Assemble Roadmap Items with resources and metadata
  const itemsData = sequencedCandidates.map((cand, index) => {
    const prev = previousProgressMap.get(cand.skill.id);
    const status = prev ? prev.status : 'Not Started';
    const completionPercentage = prev ? prev.completion_percentage : 0;

    // Prerequisite skill names
    const prereqSkills = store.getPrerequisitesForSkill(cand.skill.id);
    const prereqNames = prereqSkills.map((s) => s.name);

    // Learning resource lookup
    const resources = store.getResources(cand.skill.id);
    const bestResource = resources.length > 0 ? {
      id: resources[0].id,
      title: resources[0].title,
      url: resources[0].url,
      resource_type: resources[0].resource_type,
      difficulty_level: resources[0].difficulty_level,
      platform: resources[0].platform,
    } : null;

    const priorityRank: 'Critical' | 'High' | 'Medium' | 'Low' = cand.is_core
      ? (cand.skill_gap >= 3 ? 'Critical' : 'High')
      : (cand.skill_gap >= 3 ? 'Medium' : 'Low');

    const topic = deriveTopicName(cand.skill.name, cand.current_proficiency, cand.required_proficiency);
    const difficulty = deriveDifficulty(cand.current_proficiency, cand.required_proficiency);
    const estimatedDuration = deriveDuration(cand.skill_gap, cand.required_proficiency);

    const currentLabel = PROFICIENCY_LABELS[cand.current_proficiency];
    const requiredLabel = PROFICIENCY_LABELS[cand.required_proficiency];
    const whyNeeded = `Preparing for ${career.title} requires ${requiredLabel} in ${cand.skill.name}. Your current assessed level is ${currentLabel} (Gap: ${cand.skill_gap}).`;

    return {
      sequence: index + 1,
      skill_id: cand.skill.id,
      skill_name: cand.skill.name,
      skill_category: cand.skill.category,
      topic,
      description: cand.skill.description,
      why_needed: whyNeeded,
      current_proficiency: cand.current_proficiency,
      required_proficiency: cand.required_proficiency,
      skill_gap: cand.skill_gap,
      importance: cand.importance,
      priority: priorityRank,
      difficulty,
      estimated_duration: estimatedDuration,
      prerequisites: prereqNames,
      learning_resource: bestResource,
      status,
      completion_percentage: completionPercentage,
    };
  });

  // 7. Save to Store (prevents duplicate roadmaps, maintains single active roadmap)
  const { roadmap, items } = store.saveRoadmap(student.id, career.id, career.title, itemsData);

  // 8. Determine Recommended Next Skill
  // The first incomplete item in sequence
  const recommendedNextSkill = items.find((item) => item.status !== 'Completed') || null;

  const summary = {
    total_skills_in_roadmap: items.length,
    completed_skills: items.filter((i) => i.status === 'Completed').length,
    in_progress_skills: items.filter((i) => i.status === 'In Progress').length,
    not_started_skills: items.filter((i) => i.status === 'Not Started').length,
    overall_completion: roadmap.overall_completion,
  };

  return {
    roadmap,
    items,
    recommendedNextSkill,
    targetCareer: career,
    emptyState: null,
    summary,
  };
}
