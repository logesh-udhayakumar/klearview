import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://snezlvbwnvjovhxnwhrv.supabase.co', 'sb_publishable_aJJ_m5NLvwYFM0kQkzcAKA_636kwn4w', { db: { schema: 'vendor' } });

supabase.from('payments').select('*').limit(1).then(res => {
    console.log("PAYMENTS COLUMNS:", res.data?.[0] ? Object.keys(res.data[0]) : "No data");
    console.log("DATA:", res.data);
});
