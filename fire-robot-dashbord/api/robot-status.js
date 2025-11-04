const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { robotId = 'FireBot_001' } = req.query;

    if (req.method === 'GET') {
      // Get robot status
      const { data, error } = await supabase
        .from('robots')
        .select('*')
        .eq('robot_id', robotId)
        .single();

      if (error) throw error;
      
      res.status(200).json(data || {
        robot_id: robotId,
        status: 'OFFLINE',
        operation_mode: 'AUTO',
        battery_level: 100,
        fire_detected: false,
        pump_active: false,
        obstacle_angle: 90
      });

    } else if (req.method === 'POST') {
      // Update robot status
      const updateData = req.body;
      
      const { data, error } = await supabase
        .from('robots')
        .upsert({
          robot_id: robotId,
          ...updateData,
          last_heartbeat: new Date().toISOString()
        }, {
          onConflict: 'robot_id'
        });

      if (error) throw error;
      
      res.status(200).json({ 
        success: true, 
        message: 'Robot status updated',
        data 
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
};