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

  // ---- Handle Preflight ----
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { robotId = 'FireBot_001' } = req.query;

    // ==================== GET: Retrieve Robot Status ====================
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('robots')
        .select('*')
        .eq('robot_id', robotId)
        .maybeSingle();

      if (error) throw error;

      // Return default status if robot not found
      if (!data) {
        return res.status(200).json({
          robot_id: robotId,
          status: 'OFFLINE',
          operation_mode: 'AUTO',
          battery_level: 100,
          fire_detected: false,
          pump_active: false,
          obstacle_angle: 90,
          last_heartbeat: null
        });
      }

      return res.status(200).json(data);
    }

    // ==================== POST: Update or Insert Robot Status ====================
    else if (req.method === 'POST') {
      let updateData = req.body;

      // Vercel sends raw body by default; parse if string
      if (typeof updateData === 'string') {
        try {
          updateData = JSON.parse(updateData);
        } catch {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      // Add timestamp field
      const payload = {
        robot_id: robotId,
        ...updateData,
        last_heartbeat: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('robots')
        .upsert(payload, { onConflict: 'robot_id' })
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Robot status updated successfully',
        data: data?.[0] || payload,
      });
    }

    // ==================== INVALID METHOD ====================
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Robot Status API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
