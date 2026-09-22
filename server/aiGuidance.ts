import { GoogleGenAI } from '@google/genai';
import { store, User } from './store';
import { generateSmartRecommendations } from './recommendations';

export interface AiGuidanceResponse {
  answer: string;
  mode: 'ai_powered' | 'offline_deterministic';
  context_summary: {
    target_career: string;
    readiness_percentage: number;
    top_skill_gaps: string[];
    strongest_skills: string[];
    roadmap_completion: number;
  };
  followup_questions: string[];
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function generateCareerGuidance(
  studentId: number,
  userQuestion: string
): Promise<AiGuidanceResponse> {
  const student = store.getUserById(studentId);
  if (!student) {
    throw new Error('Student record not found.');
  }

  // Gather authentic structured student data
  const targetCareer = student.target_career_id ? store.getCareerById(student.target_career_id) : null;
  const studentSkills = store.getStudentSkills(studentId);
  const studentSkillsMap = new Map(studentSkills.map((s) => [s.skill_id, s.proficiency]));

  // Role skills & gaps
  let roleSkills: Array<{ name: string; required: number; current: number; gap: number; importance: string }> = [];
  let readinessPct = 0;

  if (targetCareer) {
    const rsList = store.getRoleSkillsByRoleId(targetCareer.id);
    let totalReq = 0;
    let totalAcq = 0;
    roleSkills = rsList.map((rs) => {
      const sk = store.getSkillById(rs.skill_id);
      const name = sk ? sk.name : 'Unknown';
      const cur = studentSkillsMap.get(rs.skill_id) || 0;
      const gap = Math.max(0, rs.required_proficiency - cur);
      totalReq += rs.required_proficiency;
      totalAcq += Math.min(rs.required_proficiency, cur);
      return {
        name,
        required: rs.required_proficiency,
        current: cur,
        gap,
        importance: rs.importance || (rs.is_core ? 'Critical' : 'Important'),
      };
    });
    if (totalReq > 0) readinessPct = Math.round((totalAcq / totalReq) * 100);
  }

  // Strongest skills
  const strongestSkills = studentSkills
    .map((ss) => {
      const sk = store.getSkillById(ss.skill_id);
      return { name: sk?.name || 'Skill', proficiency: ss.proficiency };
    })
    .filter((s) => s.proficiency >= 3)
    .sort((a, b) => b.proficiency - a.proficiency)
    .map((s) => `${s.name} (Level ${s.proficiency}/5)`);

  // Gaps
  const majorGaps = roleSkills
    .filter((s) => s.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .map((s) => `${s.name} (Current: ${s.current}/5, Required: ${s.required}/5)`);

  // Roadmap progress
  const roadmap = store.getRoadmapByStudentId(studentId);
  const roadmapComp = roadmap ? roadmap.overall_completion : 0;

  // Smart recommendations
  const recommendationResult = generateSmartRecommendations(studentId);
  const topRec = recommendationResult.top_recommendation;

  // Recent job analyses
  const jobAnalyses = store.getJobAnalysesByStudentId(studentId);
  const latestJob = jobAnalyses.length > 0 ? jobAnalyses[0] : null;

  const contextSummary = {
    target_career: targetCareer ? targetCareer.title : 'None Selected Yet',
    readiness_percentage: readinessPct,
    top_skill_gaps: majorGaps.slice(0, 4),
    strongest_skills: strongestSkills.slice(0, 4),
    roadmap_completion: roadmapComp,
  };

  const followupQuestions = [
    'What should I learn next?',
    'Why is this skill recommended over others?',
    'How ready am I to apply for entry-level roles?',
    'What are my strongest transferable skills?',
  ];

  // Try calling Gemini API if key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const client = getAiClient();
      if (client) {
        const systemPrompt = `You are an expert, supportive, and precise Career Advisor integrated into the "Skill Gap Analyzer & Learning Roadmap" platform.
Your job is to provide personalized, grounded advice strictly adhering to the student's authentic data provided below.

STRICT CONSTRAINTS:
1. Do NOT invent fake skills, fake certifications, fake companies, or employment guarantees.
2. Ground all advice directly in their actual target career, recorded skill levels, identified gaps, and roadmap progress.
3. Be encouraging, concise, highly structured, and actionable. Use bullet points where appropriate.
4. If asked about something not in the data, state clearly what the data shows and suggest steps within the platform.`;

        const userPrompt = `Student Data Context:
- Target Career: ${contextSummary.target_career}
- Career Match Readiness: ${readinessPct}%
- Roadmap Overall Completion: ${roadmapComp}%
- Top Skill Gaps: ${majorGaps.join(', ') || 'No gaps identified'}
- Strongest Logged Skills: ${strongestSkills.join(', ') || 'None logged at Level 3+'}
- Top System Recommendation: ${
          topRec
            ? `${topRec.skill_name} (Priority Score: ${topRec.priority_score}, Current: ${topRec.current_proficiency}/5, Required: ${topRec.required_proficiency}/5)`
            : 'None'
        }
${
  latestJob
    ? `- Latest Analyzed Job: ${latestJob.job_title} at ${latestJob.company || 'Unspecified'} (Match: ${latestJob.match_score}%)`
    : ''
}

Student Question: "${userQuestion}"

Please provide a tailored, insightful answer:`;

        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
          ],
        });

        const text = response.text?.trim();
        if (text && text.length > 20) {
          return {
            answer: text,
            mode: 'ai_powered',
            context_summary: contextSummary,
            followup_questions: followupQuestions,
          };
        }
      }
    } catch (err: any) {
      console.warn('Gemini API call unsuccessful, falling back to deterministic advice engine:', err?.message);
    }
  }

  // Fallback: Intelligent Deterministic Guidance Engine
  const offlineAnswer = buildDeterministicCareerAdvice(
    userQuestion,
    targetCareer?.title,
    readinessPct,
    roadmapComp,
    majorGaps,
    strongestSkills,
    topRec
  );

  return {
    answer: offlineAnswer,
    mode: 'offline_deterministic',
    context_summary: contextSummary,
    followup_questions: followupQuestions,
  };
}

function buildDeterministicCareerAdvice(
  question: string,
  targetCareerTitle: string | undefined,
  readinessPct: number,
  roadmapComp: number,
  majorGaps: string[],
  strongestSkills: string[],
  topRec: any
): string {
  const qLower = question.toLowerCase();

  if (!targetCareerTitle) {
    return `### Target Career Selection Recommended

You currently have not selected a target career path. 

To receive personalized guidance and calculated skill gaps:
1. Navigate to **Careers** from the sidebar.
2. Select your desired trajectory (e.g., *Data Analyst*, *Full Stack Developer*, etc.).
3. Your tailored roadmap and prioritized skill recommendations will activate immediately.`;
  }

  if (qLower.includes('what should i learn next') || qLower.includes('next') || qLower.includes('priority')) {
    if (topRec) {
      return `### Recommended Next Step: Master **${topRec.skill_name}**

Based on your target role as **${targetCareerTitle}** (Current Readiness: **${readinessPct}%**):

- **Target Skill**: ${topRec.skill_name} (${topRec.skill_category})
- **Current Proficiency**: Level ${topRec.current_proficiency}/5
- **Required Proficiency**: Level ${topRec.required_proficiency}/5 (Gap: ${topRec.skill_gap})
- **Priority Rating**: Priority Score **${topRec.priority_score}** (${topRec.importance} Importance)

**Key Reasons**:
${topRec.reasons.map((r: string) => `• ${r}`).join('\n')}

${topRec.is_locked ? `⚠️ **Prerequisite Note**: Make sure you satisfy foundational dependencies first.` : `✅ **Ready to Study**: Foundational prerequisites are clear.`}

You can begin directly through the **Roadmap** tab or study the recommended learning resource.`;
    }
  }

  if (qLower.includes('ready') || qLower.includes('internship') || qLower.includes('job') || qLower.includes('apply')) {
    let readinessTone = '';
    if (readinessPct >= 80) {
      readinessTone = `You are in a strong position! At **${readinessPct}% career readiness**, you meet the core technical proficiencies for entry-level and junior roles. Focus on portfolio projects and polishing your resume.`;
    } else if (readinessPct >= 50) {
      readinessTone = `You are progressing well at **${readinessPct}% career readiness**. While you have good foundational skills, closing your top gaps will make your applications significantly more competitive.`;
    } else {
      readinessTone = `You are in the active building phase at **${readinessPct}% career readiness**. We recommend focusing on closing high-priority core gaps before applying widely.`;
    }

    return `### Readiness Assessment for **${targetCareerTitle}**

${readinessTone}

**Current Profile Breakdown**:
• **Career Benchmark Match**: ${readinessPct}%
• **Roadmap Completion**: ${roadmapComp}%
• **Primary Gaps to Close**: ${majorGaps.slice(0, 3).join(', ') || 'No critical gaps'}
• **Strongest Proficiencies**: ${strongestSkills.join(', ') || 'Keep logging your skills'}

**Actionable Advice**:
1. Work through the next milestone in your personalized roadmap.
2. Analyze real job descriptions using the **Job Analyzer** to track market alignment.
3. Keep your profile proficiency levels updated as you complete projects.`;
  }

  if (qLower.includes('strongest') || qLower.includes('strength')) {
    return `### Your Core Strengths

Based on your verified skills in the system:

${
  strongestSkills.length > 0
    ? strongestSkills.map((s) => `• **${s}**`).join('\n')
    : '• You have not yet logged skills at Level 3 (Intermediate) or higher. Update your skill profile to highlight your strengths!'
}

These technical proficiencies provide a foundation for advancing into specialized topics in your **${targetCareerTitle}** pathway.`;
  }

  // Default response
  return `### Career Guidance for **${targetCareerTitle}**

Here is your current career progression summary:
• **Career Match Readiness**: ${readinessPct}%
• **Roadmap Progress**: ${roadmapComp}% complete
• **Key Skill Gaps**: ${majorGaps.slice(0, 3).join(', ') || 'All requirements satisfied!'}
• **Next Recommended Skill**: ${topRec ? topRec.skill_name : 'Check Roadmap'}

*Notice: AI career guidance is operating in deterministic offline mode based on your verified application records.*`;
}
