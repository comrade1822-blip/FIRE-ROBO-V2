import { createClient } from '@supabase/supabase-js';

// ==================== SUPABASE INITIALIZATION ====================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==================== MAIN HANDLER ====================
export default async function handler(req, res) {
  // ---- CORS HEADERS ----
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // ---- Handle preflight ----
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ==================== GET (optional for debugging) ====================
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('commands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // ==================== POST: SEND COMMAND ====================
    if (req.method === 'POST') {
      let body = req.body;

      // Parse JSON if needed
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      const { robotId = 'FireBot_001', command } = body || {};

      if (!command) {
        return res.status(400).json({ error: 'Command is required' });
      }

      // Insert command record
      const { data, error } = await supabase
        .from('commands')
        .insert([
          {
            robot_id: robotId,
            command,
            acknowledged: false,
            timestamp: Date.now()
          }
        ])
        .select();

      if (error) throw error;

      const inserted = data && data[0] ? data[0] : null;

      return res.status(201).json({
        success: true,
        message: 'Command sent successfully',
        commandId: inserted ? inserted.id : null
      });
    }

    // ==================== INVALID METHOD ====================
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Command API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
