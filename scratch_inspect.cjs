const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://knftgzrgifmvjhhnrlug.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnRnenJnaWZtdmpoaG5ybHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkyNTQyOSwiZXhwIjoyMDk0NTAxNDI5fQ.kfuOXmFIhQFAaZ9W_3L26_73MsjvZ9U18m72uFU6ZPo';

const supabase = createClient(supabaseUrl, serviceKey);

async function getUser() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error);
    return;
  }
  const user = users.find(u => u.id === 'd696e930-c034-40e3-9af2-d21a463bab42');
  console.log("User email:", user ? user.email : "Not found");
  console.log("User full object:", user);
}

getUser();
