// src/seeders/seedDummyData.js
//
// One-time dev seed script — creates dummy teachers, students, and sessions
// so the app can be exercised end-to-end without manual signup.
// Safe to re-run: existing rows (matched by email / agora_channel) are skipped.
//
// Run with:
//   node src/seeders/seedDummyData.js
//
// All dummy accounts share the same password: Password123!

require('dotenv').config();

const bcrypt = require('bcrypt');
const { getClient } = require('../config/db');

const PASSWORD = 'Password123!';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

const TEACHERS = [
  {
    email: 'teacher1@tahfeez.test', full_name: 'Ustadh Ahmad Faris', gender: 'male',
    date_of_birth: '1985-03-12', bio: 'Hafiz with 15 years of teaching experience, specializing in Tajweed and Qiraat.',
    qualifications: 'Ijazah in Hafs an Asim, Al-Azhar University graduate',
    years_experience: 15, specializations: ['tajweed', 'hifz', 'qiraat'],
    ijazah_verified: true, available_days: ['sunday', 'monday', 'wednesday'],
  },
  {
    email: 'teacher2@tahfeez.test', full_name: 'Ustadha Maryam Yusuf', gender: 'female',
    date_of_birth: '1990-07-22', bio: 'Specializes in teaching young learners and beginners with a gentle, structured approach.',
    qualifications: 'Ijazah in Hafs an Asim, Diploma in Islamic Studies',
    years_experience: 8, specializations: ['hifz', 'beginners'],
    ijazah_verified: true, available_days: ['tuesday', 'thursday', 'saturday'],
  },
  {
    email: 'teacher3@tahfeez.test', full_name: 'Ustadh Khalid Rahman', gender: 'male',
    date_of_birth: '1978-11-05', bio: 'Senior Qiraat instructor with a focus on advanced memorization and revision.',
    qualifications: 'Ijazah in multiple Qiraat, 20+ years of teaching',
    years_experience: 22, specializations: ['qiraat', 'advanced_hifz'],
    ijazah_verified: true, available_days: ['monday', 'wednesday', 'friday'],
  },
  {
    email: 'teacher4@tahfeez.test', full_name: 'Ustadha Aisha Noor', gender: 'female',
    date_of_birth: '1995-01-18', bio: 'New teacher passionate about Tajweed correction, currently awaiting ijazah verification.',
    qualifications: 'Bachelor in Quranic Studies',
    years_experience: 3, specializations: ['tajweed'],
    ijazah_verified: false, available_days: ['sunday', 'tuesday'],
  },
];

const STUDENTS = [
  { email: 'student1@tahfeez.test', full_name: 'Yusuf Ibrahim', gender: 'male', date_of_birth: '2012-05-10', total_juz_memorized: 3.5, current_level: 'beginner' },
  { email: 'student2@tahfeez.test', full_name: 'Fatimah Zahra', gender: 'female', date_of_birth: '2010-09-02', total_juz_memorized: 8, current_level: 'intermediate' },
  { email: 'student3@tahfeez.test', full_name: 'Omar Abdullah', gender: 'male', date_of_birth: '2014-02-28', total_juz_memorized: 1, current_level: 'beginner' },
  { email: 'student4@tahfeez.test', full_name: 'Khadija Ali', gender: 'female', date_of_birth: '2009-12-15', total_juz_memorized: 15, current_level: 'advanced' },
  { email: 'student5@tahfeez.test', full_name: 'Hamza Tariq', gender: 'male', date_of_birth: '2011-06-30', total_juz_memorized: 5, current_level: 'beginner' },
  { email: 'student6@tahfeez.test', full_name: 'Zainab Hussain', gender: 'female', date_of_birth: '2013-04-19', total_juz_memorized: 2, current_level: 'beginner' },
  { email: 'student7@tahfeez.test', full_name: 'Bilal Ahmed', gender: 'male', date_of_birth: '2008-10-07', total_juz_memorized: 20, current_level: 'advanced' },
  { email: 'student8@tahfeez.test', full_name: 'Sumayyah Karim', gender: 'female', date_of_birth: '2012-08-23', total_juz_memorized: 4, current_level: 'intermediate' },
];

// scheduled_at offsets are relative to "now" so sessions stay meaningfully
// placed (past/live/future) no matter when this seeder is run.
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function buildSessions(teacherIds) {
  const now = Date.now();
  return [
    {
      teacher_id: teacherIds[0], title: 'Morning Hifz Circle — Juz 1-5', session_type: 'group',
      status: 'live', scheduled_at: new Date(now - 15 * 60 * 1000), session_days: ['sunday', 'monday', 'wednesday'],
      duration_minutes: 60, max_students: 10, session_gender: 'male', age_range_min: 8, age_range_max: 14,
      agora_channel: 'tahfeez-seed-live-1', session_language: 'arabic',
    },
    {
      teacher_id: teacherIds[1], title: 'Beginners Tajweed for Girls', session_type: 'group',
      status: 'scheduled', scheduled_at: new Date(now + 2 * DAY), session_days: ['tuesday', 'thursday'],
      duration_minutes: 45, max_students: 8, session_gender: 'female', age_range_min: 6, age_range_max: 12,
      agora_channel: 'tahfeez-seed-sched-1', session_language: 'arabic',
    },
    {
      teacher_id: teacherIds[2], title: 'Advanced Qiraat Revision', session_type: 'group',
      status: 'scheduled', scheduled_at: new Date(now + 5 * DAY), session_days: ['monday', 'friday'],
      duration_minutes: 90, max_students: 6, session_gender: 'male', age_range_min: 14, age_range_max: 25,
      agora_channel: 'tahfeez-seed-sched-2', session_language: 'arabic',
    },
    {
      teacher_id: teacherIds[1], title: 'One-on-One Hifz Coaching', session_type: 'one_on_one',
      status: 'scheduled', scheduled_at: new Date(now + 1 * DAY), session_days: ['saturday'],
      duration_minutes: 30, max_students: 1, session_gender: 'female', age_range_min: 6, age_range_max: 18,
      agora_channel: 'tahfeez-seed-sched-3', session_language: 'arabic',
    },
    {
      teacher_id: teacherIds[0], title: 'Last Week’s Completed Circle', session_type: 'group',
      status: 'completed', scheduled_at: new Date(now - 7 * DAY), session_days: ['sunday'],
      duration_minutes: 60, max_students: 10, session_gender: 'male', age_range_min: 8, age_range_max: 14,
      agora_channel: 'tahfeez-seed-done-1', session_language: 'arabic',
      started_at: new Date(now - 7 * DAY), ended_at: new Date(now - 7 * DAY + 60 * 60 * 1000),
    },
    {
      teacher_id: null, title: 'Draft — Awaiting Teacher Assignment', session_type: 'group',
      status: 'draft', scheduled_at: new Date(now + 10 * DAY), session_days: ['wednesday'],
      duration_minutes: 60, max_students: 12, session_gender: 'male', age_range_min: 8, age_range_max: 16,
      agora_channel: 'tahfeez-seed-draft-1', session_language: 'arabic',
    },
  ];
}

async function upsertUser(client, { email, full_name, role, gender, date_of_birth }, passwordHash) {
  const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) return existing.rows[0].id;

  const result = await client.query(
    `INSERT INTO users (email, password_hash, role, full_name, gender, date_of_birth, status, email_verified, preferred_language)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', TRUE, 'arabic')
     RETURNING id`,
    [email, passwordHash, role, full_name, gender, date_of_birth]
  );
  return result.rows[0].id;
}

async function seedTeachers(client, passwordHash) {
  const ids = [];
  for (const t of TEACHERS) {
    const id = await upsertUser(client, { ...t, role: 'teacher' }, passwordHash);
    ids.push(id);

    const existingProfile = await client.query('SELECT user_id FROM teacher_profiles WHERE user_id = $1', [id]);
    if (!existingProfile.rows[0]) {
      await client.query(
        `INSERT INTO teacher_profiles (user_id, bio, qualifications, years_experience, specializations, ijazah_verified, available_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, t.bio, t.qualifications, t.years_experience, t.specializations, t.ijazah_verified, t.available_days]
      );
    }
  }
  return ids;
}

async function seedStudents(client, passwordHash) {
  const ids = [];
  for (const s of STUDENTS) {
    const id = await upsertUser(client, { ...s, role: 'student' }, passwordHash);
    ids.push(id);

    const existingProfile = await client.query('SELECT user_id FROM student_profiles WHERE user_id = $1', [id]);
    if (!existingProfile.rows[0]) {
      await client.query(
        `INSERT INTO student_profiles (user_id, total_juz_memorized, current_level, enrollment_date)
         VALUES ($1, $2, $3, NOW())`,
        [id, s.total_juz_memorized, s.current_level]
      );
    }
  }
  return ids;
}

async function seedSessions(client, teacherIds) {
  const sessions = buildSessions(teacherIds);
  const ids = [];
  for (const s of sessions) {
    const existing = await client.query('SELECT id FROM sessions WHERE agora_channel = $1', [s.agora_channel]);
    if (existing.rows[0]) { ids.push({ id: existing.rows[0].id, status: s.status }); continue; }

    const result = await client.query(
      `INSERT INTO sessions (
         teacher_id, title, session_type, status, scheduled_at, session_days,
         duration_minutes, max_students, session_gender, age_range_min, age_range_max,
         agora_channel, session_language, started_at, ended_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        s.teacher_id, s.title, s.session_type, s.status, s.scheduled_at, s.session_days,
        s.duration_minutes, s.max_students, s.session_gender, s.age_range_min, s.age_range_max,
        s.agora_channel, s.session_language, s.started_at ?? null, s.ended_at ?? null,
      ]
    );
    ids.push({ id: result.rows[0].id, status: s.status });
  }
  return ids;
}

async function seedEnrollments(client, sessionRows, studentIds) {
  // Enroll the first few students into the live and scheduled sessions with a mix
  // of statuses so admin/teacher approval screens have something to show.
  const enrollable = sessionRows.filter((s) => ['live', 'scheduled', 'completed'].includes(s.status));

  for (let i = 0; i < enrollable.length; i++) {
    const session = enrollable[i];
    const plan = ['approved', 'approved', 'pending', 'rejected'];
    for (let j = 0; j < plan.length && j < studentIds.length; j++) {
      const studentId = studentIds[(i + j) % studentIds.length];
      const status = plan[j];

      const existing = await client.query(
        'SELECT id FROM session_enrollments WHERE session_id = $1 AND student_id = $2',
        [session.id, studentId]
      );
      if (existing.rows[0]) continue;

      await client.query(
        `INSERT INTO session_enrollments (session_id, student_id, status, approved_at)
         VALUES ($1, $2, $3, $4)`,
        [session.id, studentId, status, status === 'approved' ? new Date() : null]
      );
    }
  }
}

async function main() {
  const client = await getClient();
  try {
    const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

    await client.query('BEGIN');

    console.log('Seeding teachers...');
    const teacherIds = await seedTeachers(client, passwordHash);

    console.log('Seeding students...');
    const studentIds = await seedStudents(client, passwordHash);

    console.log('Seeding sessions...');
    const sessionRows = await seedSessions(client, teacherIds);

    console.log('Seeding enrollments...');
    await seedEnrollments(client, sessionRows, studentIds);

    await client.query('COMMIT');

    console.log('\nDone. All dummy accounts use the password: ' + PASSWORD);
    console.log('\nTeachers:');
    TEACHERS.forEach((t) => console.log(`  ${t.email}`));
    console.log('\nStudents:');
    STUDENTS.forEach((s) => console.log(`  ${s.email}`));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    process.exit();
  }
}

main();
