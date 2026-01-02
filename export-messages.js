import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://orgnduftnhgufeiweyoe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ25kdWZ0bmhndWZlaXdleW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzAzMTIsImV4cCI6MjA2OTAwNjMxMn0.Tdty67UyqoagmxFFhnINdg4zt3YbwwPZJdbPDjnupcI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function exportAllMessages() {
  console.log('Starting export...');
  
  // Fetch all messages
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
    return;
  }

  // Fetch total count from stats
  const { data: stats, error: statsError } = await supabase
    .from('stats')
    .select('total_messages')
    .eq('id', 1)
    .single();

  if (statsError) {
    console.error('Error fetching stats:', statsError);
  }

  const exportData = {
    exportDate: new Date().toISOString(),
    totalMessages: stats?.total_messages || messages.length,
    messageCount: messages.length,
    messages: messages
  };

  console.log(`✅ Exported ${messages.length} messages`);
  console.log(`📊 Total messages ever sent: ${exportData.totalMessages}`);
  console.log('\nCopy the JSON below and save it as archive/messages.json:\n');
  console.log(JSON.stringify(exportData, null, 2));
}

exportAllMessages();