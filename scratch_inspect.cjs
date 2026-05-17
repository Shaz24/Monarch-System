const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://knftgzrgifmvjhhnrlug.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnRnenJnaWZtdmpoaG5ybHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkyNTQyOSwiZXhwIjoyMDk0NTAxNDI5fQ.kfuOXmFIhQFAaZ9W_3L26_73MsjvZ9U18m72uFU6ZPo';

const supabase = createClient(supabaseUrl, serviceKey);

async function inspect() {
  console.log("Listing all users from auth.users...");
  const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.error("List users error:", usersErr);
    return;
  }
  console.log("Total users in system:", users.length);
  users.forEach(u => console.log(`User: ${u.email} (ID: ${u.id})`));

  console.log("\nSelecting all rows from daily_laws table...");
  const { data: laws, error: lawsErr } = await supabase.from('daily_laws').select('*');
  if (lawsErr) {
    console.error("Laws select error:", lawsErr);
    return;
  }
  console.log("Total rows in daily_laws:", laws.length);
  console.log(laws);
}

inspect();
