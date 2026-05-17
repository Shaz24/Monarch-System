const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://knftgzrgifmvjhhnrlug.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnRnenJnaWZtdmpoaG5ybHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjU0MjksImV4cCI6MjA5NDUwMTQyOX0.IfOiV7d2jPcE3l5vKjvghk9dBJXY-4G5Oli-JS6jbWk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  console.log("Checking daily_laws...");
  const { data: laws, error: lawsErr } = await supabase.from('daily_laws').select('*');
  console.log("Laws count:", laws ? laws.length : 0);
  if (lawsErr) console.error("Laws Select Error:", lawsErr);
  else console.log("Laws rows:", laws);

  console.log("\nAttempting delete daily_laws...");
  const { data: delData, error: delErr } = await supabase.from('daily_laws').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Delete result error:", delErr);
  console.log("Delete result data:", delData);
}

inspect();
