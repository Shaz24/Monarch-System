const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://knftgzrgifmvjhhnrlug.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnRnenJnaWZtdmpoaG5ybHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkyNTQyOSwiZXhwIjoyMDk0NTAxNDI5fQ.kfuOXmFIhQFAaZ9W_3L26_73MsjvZ9U18m72uFU6ZPo';

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const email = `test_browser_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log("Creating confirmed test user for browser...");
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    console.error("Error creating user:", authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log("Created user ID:", userId);

  console.log("Seeding profile and stats for user...");
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    username: `test_browser_${Date.now()}`,
    display_name: 'Test Browser User'
  });

  if (profileError) {
    console.error("Error creating profile:", profileError.message);
    process.exit(1);
  }

  console.log("SUCCESS");
  console.log(`EMAIL:${email}`);
  console.log(`PASSWORD:${password}`);
}

run();
