const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { robotId = 'FireBot_001' } = req.query;

    if (req.method === 'GET') {
      // Get notifications
      const limit = parseInt(req.query.limit) || 15;
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('robot_id', robotId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      res.status(200).json(data || []);

    } else if (req.method === 'POST') {
      // Add notification
      const { type, message, timestamp = Date.now() } = req.body;

      if (!type || !message) {
        return res.status(400).json({ error: 'Type and message are required' });
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          robot_id: robotId,
          type,
          message,
          timestamp
        })
        .select();

      if (error) throw error;

      res.status(201).json({ 
        success: true, 
        message: 'Notification added',
        notificationId: data[0].id
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notifications Error:', error);
    res.status(500).json({ error: error.message });
  }
};