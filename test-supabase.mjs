import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vomktsnufaatfxesbqfl.supabase.co';
const supabaseKey = 'sb_publishable_hlmExlU1508_IsiytG7vow_8sKJg62F';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await supabase.from('clients').select('*').limit(1);
    if (error) {
      console.log('Response status from Supabase (tables status):', error.message);
      if (error.code === 'PGRST204' || error.message.includes('relation "public.clients" does not exist') || error.message.includes('not find the table')) {
        console.log('Note: Tables are not yet created in the Supabase database. Schema execution is needed in SQL editor.');
      }
    } else {
      console.log('Connection SUCCESSFUL! Data:', data);
    }
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection();
