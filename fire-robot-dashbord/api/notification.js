import { createClient } from '@supabase/supabase-js';

// ==================== SUPABASE CLIENT ====================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==================== API HANDLER ====================
export default async function handler(req, res) {
  // --- Set CORS headers ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // --- Handle preflight ---
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { robotId = 'FireBot_001' } = req.query;

    // ==================== GET NOTIFICATIONS ====================
    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit) || 15;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('robot_id', robotId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return res.status(200).json(data || []);
    }

    // ==================== POST NEW NOTIFICATION ====================
    else if (req.method === 'POST') {
      // Parse body safely (Vercel doesn't auto-parse)
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      const { type, message, timestamp = Date.now() } = body || {};

      if (!type || !message) {
        return res.status(400).json({ error: 'Type and message are required' });
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            robot_id: robotId,
            type,
            message,
            timestamp
          }
        ])
        .select(); // Supported in Supabase v2 SDK

      if (error) throw error;

      const inserted = data && data[0] ? data[0] : null;

      return res.status(201).json({
        success: true,
        message: 'Notification added successfully',
        notificationId: inserted ? inserted.id : null
      });
    }

    // ==================== INVALID METHOD ====================
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notifications API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
