import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
let failures: string[] = [];
let passes = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passes++;
    console.log(`  ✓ ${msg}`);
  } else {
    failures.push(msg);
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

async function runTests() {
  console.log('--- STARTING QA TEST SUITE ---');

  // 1. Health
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    assert(res.status === 200 && res.data.status === 'healthy', 'GET /health returns healthy');
  } catch (err: any) {
    assert(false, `GET /health failed: ${err.message}`);
  }

  // 2. Authentication
  let studentToken = '';
  let adminToken = '';
  let studentUser: any = null;

  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'student@skillgap.com',
      password: 'Student@12345',
    });
    assert(res.status === 200 && !!res.data.access_token, 'Student login succeeds');
    studentToken = res.data.access_token;
    studentUser = res.data.user;
  } catch (err: any) {
    assert(false, `Student login failed: ${err.response?.data?.error || err.message}`);
  }

  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@skillgap.com',
      password: 'Admin@12345',
    });
    assert(res.status === 200 && !!res.data.access_token, 'Admin login succeeds');
    adminToken = res.data.access_token;
  } catch (err: any) {
    assert(false, `Admin login failed: ${err.response?.data?.error || err.message}`);
  }

  // Invalid login credentials
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'student@skillgap.com',
      password: 'WrongPassword!',
    });
    assert(false, 'Login with invalid password should fail');
  } catch (err: any) {
    assert(err.response?.status === 401, 'Login with invalid password returns 401');
  }

  // Non-existent email
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'nonexistent_user_9999@test.com',
      password: 'Password@123',
    });
    assert(false, 'Login with non-existent email should fail');
  } catch (err: any) {
    assert(err.response?.status === 401, 'Login with non-existent email returns 401');
  }

  // Duplicate registration
  try {
    await axios.post(`${BASE_URL}/api/auth/register`, {
      full_name: 'Existing Student',
      email: 'student@skillgap.com',
      password: 'Password@123',
    });
    assert(false, 'Register with duplicate email should fail');
  } catch (err: any) {
    assert(err.response?.status === 409, 'Register with duplicate email returns 409');
  }

  // Short password registration
  try {
    await axios.post(`${BASE_URL}/api/auth/register`, {
      full_name: 'Test Student',
      email: 'shortpass@test.com',
      password: '123',
    });
    assert(false, 'Register with short password should fail');
  } catch (err: any) {
    assert(err.response?.status === 400, 'Register with short password returns 400');
  }

  // Create Student B for data isolation testing
  let studentBToken = '';
  let studentBUser: any = null;
  const testStudentBEmail = `test_student_b_${Date.now()}@skillgap.com`;
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/register`, {
      full_name: 'Student B Tester',
      email: testStudentBEmail,
      password: 'Password@123',
      qualification: 'B.Tech IT',
      graduation_year: 2026,
    });
    assert(res.status === 201 && !!res.data.access_token, 'Register Student B succeeds');
    studentBToken = res.data.access_token;
    studentBUser = res.data.user;
  } catch (err: any) {
    assert(false, `Register Student B failed: ${err.response?.data?.error || err.message}`);
  }

  // 3. Authorization & Security Separation
  // Student calling Admin endpoints -> MUST return 403
  try {
    await axios.post(
      `${BASE_URL}/api/careers`,
      { title: 'Hacker Role', description: 'desc' },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    assert(false, 'Student POST /api/careers should be forbidden');
  } catch (err: any) {
    assert(err.response?.status === 403, 'Student POST /api/careers returns 403');
  }

  try {
    await axios.get(`${BASE_URL}/api/analytics/admin`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(false, 'Student GET /api/analytics/admin should be forbidden');
  } catch (err: any) {
    assert(err.response?.status === 403, 'Student GET /api/analytics/admin returns 403');
  }

  try {
    await axios.get(`${BASE_URL}/api/users/students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(false, 'Student GET /api/users/students should be forbidden');
  } catch (err: any) {
    assert(err.response?.status === 403, 'Student GET /api/users/students returns 403');
  }

  // Admin calling Student-only endpoints -> MUST return 403
  try {
    await axios.get(`${BASE_URL}/api/student-skills`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(false, 'Admin GET /api/student-skills should be forbidden');
  } catch (err: any) {
    assert(err.response?.status === 403, 'Admin GET /api/student-skills returns 403');
  }

  // 4. Student Data Isolation Tests
  // Student A sets target career, adds skills, creates a job analysis
  let studentAJobId = 0;
  try {
    await axios.put(
      `${BASE_URL}/api/users/target-career`,
      { career_id: 1 },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    const jobRes = await axios.post(
      `${BASE_URL}/api/job-analysis/analyze`,
      {
        job_title: 'Full Stack Engineer',
        company: 'Acme Corp',
        job_description: 'We are seeking a Full Stack Engineer experienced with React, Node.js, TypeScript, SQL, and Docker.',
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    studentAJobId = jobRes.data.analysis.id;
    assert(studentAJobId > 0, 'Student A created job analysis successfully');
  } catch (err: any) {
    assert(false, `Student A job analysis setup failed: ${err.message}`);
  }

  // Student B attempts to access Student A's job analysis -> MUST return 403
  try {
    await axios.get(`${BASE_URL}/api/job-analysis/${studentAJobId}`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    assert(false, "Student B GET Student A's job analysis should be forbidden");
  } catch (err: any) {
    assert(err.response?.status === 403, "Student B GET Student A's job analysis returns 403");
  }

  // Student B attempts to delete Student A's job analysis -> MUST return 403
  try {
    await axios.delete(`${BASE_URL}/api/job-analysis/${studentAJobId}`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    assert(false, "Student B DELETE Student A's job analysis should be forbidden");
  } catch (err: any) {
    assert(err.response?.status === 403, "Student B DELETE Student A's job analysis returns 403");
  }

  // 5. Skill Gap Analysis (Phase 3)
  try {
    const res = await axios.get(`${BASE_URL}/api/analysis`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res.status === 200, 'GET /api/analysis returns 200');
    assert(typeof res.data.analysis.readiness_percentage === 'number', 'Readiness score is numeric');
    assert(
      res.data.analysis.readiness_percentage >= 0 && res.data.analysis.readiness_percentage <= 100,
      'Readiness percentage is between 0 and 100'
    );
    assert(Array.isArray(res.data.analysis.strengths), 'Strengths is an array');
    assert(Array.isArray(res.data.analysis.weaknesses), 'Weaknesses is an array');
    assert(Array.isArray(res.data.analysis.missing_skills), 'Missing skills is an array');
  } catch (err: any) {
    assert(false, `GET /api/analysis failed: ${err.response?.data?.error || err.message}`);
  }

  // 6. Roadmap (Phase 4)
  let studentARoadmapItemId: number | null = null;
  try {
    const res = await axios.get(`${BASE_URL}/api/roadmap`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res.status === 200, 'GET /api/roadmap returns 200');
    if (res.data.items && res.data.items.length > 0) {
      const item = res.data.items[0];
      studentARoadmapItemId = item.id;
      assert(item.sequence === 1, 'First roadmap item sequence is 1');
      assert(!!item.skill_name, 'First roadmap item has skill_name');
    }
  } catch (err: any) {
    assert(false, `GET /api/roadmap failed: ${err.response?.data?.error || err.message}`);
  }

  // Student A updates their own roadmap item
  if (studentARoadmapItemId) {
    try {
      const res = await axios.put(
        `${BASE_URL}/api/roadmap/items/${studentARoadmapItemId}`,
        { status: 'In Progress', completion_percentage: 50 },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      assert(res.status === 200, 'Student A updates roadmap item to In Progress (50%)');
      assert(res.data.item.status === 'In Progress', 'Roadmap item status is In Progress');
      assert(res.data.item.completion_percentage === 50, 'Roadmap item completion is 50%');
    } catch (err: any) {
      assert(false, `Student A roadmap update failed: ${err.response?.data?.error || err.message}`);
    }

    // Student B attempts to update Student A's roadmap item -> MUST return 403
    try {
      await axios.put(
        `${BASE_URL}/api/roadmap/items/${studentARoadmapItemId}`,
        { status: 'Completed', completion_percentage: 100 },
        { headers: { Authorization: `Bearer ${studentBToken}` } }
      );
      assert(false, "Student B update Student A's roadmap item should be forbidden");
    } catch (err: any) {
      assert(err.response?.status === 403, "Student B update Student A's roadmap item returns 403");
    }
  }

  // Student Skills Management & Data Isolation
  let studentASkillEntryId: number | null = null;
  try {
    const addSkillRes = await axios.post(
      `${BASE_URL}/api/student-skills`,
      { skill_id: 1, proficiency: 3 },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    assert(addSkillRes.status === 200 || addSkillRes.status === 201, 'Student A added/updated skill');
    studentASkillEntryId = addSkillRes.data.skill.id;
  } catch (err: any) {
    assert(false, `Student A skill add failed: ${err.response?.data?.error || err.message}`);
  }

  if (studentASkillEntryId) {
    // Student B attempts to modify Student A's skill -> MUST return 403
    try {
      await axios.put(
        `${BASE_URL}/api/student-skills/${studentASkillEntryId}`,
        { proficiency: 5 },
        { headers: { Authorization: `Bearer ${studentBToken}` } }
      );
      assert(false, "Student B update Student A's skill should be forbidden");
    } catch (err: any) {
      assert(err.response?.status === 403, "Student B update Student A's skill returns 403");
    }

    // Student B attempts to delete Student A's skill -> MUST return 403
    try {
      await axios.delete(`${BASE_URL}/api/student-skills/${studentASkillEntryId}`, {
        headers: { Authorization: `Bearer ${studentBToken}` },
      });
      assert(false, "Student B delete Student A's skill should be forbidden");
    } catch (err: any) {
      assert(err.response?.status === 403, "Student B delete Student A's skill returns 403");
    }
  }

  // Student B attempts to append Student A's job gaps to roadmap -> MUST return 403
  try {
    await axios.post(
      `${BASE_URL}/api/job-analysis/${studentAJobId}/add-to-roadmap`,
      {},
      { headers: { Authorization: `Bearer ${studentBToken}` } }
    );
    assert(false, "Student B append Student A's job gaps should be forbidden");
  } catch (err: any) {
    assert(err.response?.status === 403, "Student B append Student A's job gaps returns 403");
  }

  // Student A appends job gaps to roadmap
  try {
    const res = await axios.post(
      `${BASE_URL}/api/job-analysis/${studentAJobId}/add-to-roadmap`,
      {},
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    assert(res.status === 200, "Student A appends job gaps to roadmap successfully");
  } catch (err: any) {
    assert(false, `Student A append job gaps failed: ${err.response?.data?.error || err.message}`);
  }

  // Admin CRUD for Skills
  let createdSkillId: number | null = null;
  const testSkillName = `GraphQL Test Skill ${Date.now()}`;
  try {
    const res = await axios.post(
      `${BASE_URL}/api/skills`,
      { name: testSkillName, category: 'Backend Development', description: 'Query language for APIs.' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(res.status === 201, 'Admin created new skill');
    createdSkillId = res.data.skill.id;
  } catch (err: any) {
    assert(false, `Admin create skill failed: ${err.response?.data?.error || err.message}`);
  }

  if (createdSkillId) {
    try {
      const res = await axios.put(
        `${BASE_URL}/api/skills/${createdSkillId}`,
        { description: 'Updated GraphQL API description.' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert(res.status === 200, 'Admin updated skill');
    } catch (err: any) {
      assert(false, `Admin update skill failed: ${err.response?.data?.error || err.message}`);
    }
  }

  // Admin CRUD for Careers
  let createdCareerId: number | null = null;
  const testCareerTitle = `DevOps Specialist Test ${Date.now()}`;
  try {
    const res = await axios.post(
      `${BASE_URL}/api/careers`,
      { title: testCareerTitle, category: 'Cloud & Infrastructure', description: 'Automates deployments.' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(res.status === 201, 'Admin created new career');
    createdCareerId = res.data.career.id;
  } catch (err: any) {
    assert(false, `Admin create career failed: ${err.response?.data?.error || err.message}`);
  }

  if (createdCareerId) {
    try {
      const res = await axios.put(
        `${BASE_URL}/api/careers/${createdCareerId}`,
        { description: 'Updated DevOps description.' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert(res.status === 200, 'Admin updated career');
    } catch (err: any) {
      assert(false, `Admin update career failed: ${err.response?.data?.error || err.message}`);
    }
  }

  // 7. Phase 6 Features
  // AI Career Advisor
  try {
    const res = await axios.post(
      `${BASE_URL}/api/ai/career-guidance`,
      { question: 'What skills should I prioritize to become a Full Stack Developer?' },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    assert(res.status === 200, 'POST /api/ai/career-guidance returns 200');
    assert(!!res.data.answer, 'Career guidance returned answer');
  } catch (err: any) {
    assert(false, `AI career guidance failed: ${err.response?.data?.error || err.message}`);
  }

  // Progress History
  try {
    const res = await axios.get(`${BASE_URL}/api/progress/history`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res.status === 200, 'GET /api/progress/history returns 200');
    assert(Array.isArray(res.data.snapshots), 'Snapshots is an array');
  } catch (err: any) {
    assert(false, `Progress history failed: ${err.response?.data?.error || err.message}`);
  }
  // Recommendations
  try {
    const res = await axios.get(`${BASE_URL}/api/recommendations`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res.status === 200, 'GET /api/recommendations returns 200');
    assert(res.data.has_target_career === true, 'Recommendations has target career');
  } catch (err: any) {
    assert(false, `GET /api/recommendations failed: ${err.message}`);
  }

  // Career Comparison
  try {
    const res = await axios.get(`${BASE_URL}/api/careers/compare?ids=1,2`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res.status === 200, 'GET /api/careers/compare?ids=1,2 returns 200');
    assert(Array.isArray(res.data.careers), 'Comparison careers is an array');
    assert(Array.isArray(res.data.transferable_skills), 'Transferable skills is an array');
  } catch (err: any) {
    assert(false, `GET /api/careers/compare failed: ${err.message}`);
  }

  // Resume Analyzer (text mode)
  try {
    const res = await axios.post(
      `${BASE_URL}/api/resume/analyze`,
      {
        resume_text:
          'Alex Johnson\nFull Stack Developer with 2 years of experience in JavaScript, React, Node.js, SQL, Git, and REST APIs. Education: Bachelor of Science in Computer Science. Certifications: AWS Cloud Practitioner.',
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    assert(res.status === 200, 'POST /api/resume/analyze with text returns 200');
    assert(res.data.analysis.parsed_skills.length > 0, 'Extracted skills from resume');
  } catch (err: any) {
    assert(false, `POST /api/resume/analyze failed: ${err.response?.data?.error || err.message}`);
  }

  // Achievements
  try {
    const res = await axios.get(`${BASE_URL}/api/achievements/user`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res.status === 200, 'GET /api/achievements/user returns 200');
    assert(Array.isArray(res.data.achievements), 'Achievements is an array');
  } catch (err: any) {
    assert(false, `GET /api/achievements/user failed: ${err.message}`);
  }

  // Activity Center
  try {
    const res = await axios.get(`${BASE_URL}/api/activity`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res.status === 200, 'GET /api/activity returns 200');
    assert(Array.isArray(res.data.activities), 'Activities is an array');
  } catch (err: any) {
    assert(false, `GET /api/activity failed: ${err.message}`);
  }

  // Admin Analytics
  try {
    const res = await axios.get(`${BASE_URL}/api/analytics/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res.status === 200, 'Admin analytics returns 200');
    assert(typeof res.data.analytics.total_students === 'number', 'Total students is a number');
    assert(typeof res.data.analytics.total_skills === 'number', 'Total skills is a number');
  } catch (err: any) {
    assert(false, `Admin analytics failed: ${err.message}`);
  }

  console.log(`\n--- SUMMARY: ${passes} PASSED, ${failures.length} FAILED ---`);
  if (failures.length > 0) {
    console.error('Failures:', failures);
    process.exit(1);
  }
}

runTests();
