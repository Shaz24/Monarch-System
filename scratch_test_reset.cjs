const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://knftgzrgifmvjhhnrlug.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnRnenJnaWZtdmpoaG5ybHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjU0MjksImV4cCI6MjA5NDUwMTQyOX0.IfOiV7d2jPcE3l5vKjvghk9dBJXY-4G5Oli-JS6jbWk';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnRnenJnaWZtdmpoaG5ybHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkyNTQyOSwiZXhwIjoyMDk0NTAxNDI5fQ.kfuOXmFIhQFAaZ9W_3L26_73MsjvZ9U18m72uFU6ZPo';

const adminClient = createClient(supabaseUrl, serviceKey);
const userClient = createClient(supabaseUrl, anonKey);

async function runTest() {
  const email = `test_reset_${Date.now()}@example.com`;
  const password = 'TestPassword123!';

  console.log("Creating test user...");
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    console.error("Error creating user:", authError);
    return;
  }

  const userId = authData.user.id;
  console.log("Created user ID:", userId);

  console.log("Signing in as user...");
  const { error: signInError } = await userClient.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error("Sign in error:", signInError);
    return;
  }

  console.log("Seeding profile and stats for user...");
  // Profiles is auto seeded or we insert
  await adminClient.from('profiles').insert({
    id: userId,
    username: 'test_reset_user',
    display_name: 'Test Reset User'
  });

  // Seed daily_laws
  console.log("Seeding daily_laws...");
  await userClient.from('daily_laws').insert({
    user_id: userId,
    date: new Date().toISOString().split('T')[0],
    workout_done: true,
    all_laws_completed: true
  });

  // Let's perform the reset as the user!
  console.log("\nRunning reset operations as user...");
  const results = await Promise.allSettled([
    userClient.from('activity_logs').delete().eq('user_id', userId),
    userClient.from('task_completions').delete().eq('user_id', userId),
    userClient.from('boss_battles').delete().eq('user_id', userId),
    userClient.from('daily_laws').delete().eq('user_id', userId),
    userClient.from('aura_log').delete().eq('user_id', userId),
    userClient.from('stats').update({ xp: 0, level: 1 }).eq('user_id', userId),
    userClient.from('profiles').update({ current_xp: 0, current_level: 1, streak_days: 0, aura_score: 0, total_xp_alltime: 0 }).eq('id', userId)
  ]);

  results.forEach((r, i) => {
    console.log(`Promise ${i + 1}:`, r.status);
    if (r.status === 'fulfilled') {
      if (r.value.error) {
        console.error(`Promise ${i + 1} DB Error:`, r.value.error);
      } else {
        console.log(`Promise ${i + 1} Success!`);
      }
    } else {
      console.error(`Promise ${i + 1} Rejected:`, r.reason);
    }
  });

  console.log("\nCleaning up test user...");
  await adminClient.auth.admin.deleteUser(userId);
}

runTest();
