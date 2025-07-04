// Supabase configuration
const SUPABASE_URL = 'https://wyfimfijxshldtgfveli.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZmltZmlqeHNobGR0Z2Z2ZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNTg0NzIsImV4cCI6MjA2MTgzNDQ3Mn0.4y78dp9SBW3MakIIs1NdYE31VthsRTm4xMdLh_nSmj0';

// Use the global supabase object from the CDN
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 