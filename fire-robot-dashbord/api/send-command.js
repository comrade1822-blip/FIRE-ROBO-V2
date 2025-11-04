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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { robotId = 'FireBot_001', command } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    // Insert command
    const { data, error } = await supabase
      .from('commands')
      .insert({
        robot_id: robotId,
        command: command,
        acknowledged: false
      })
      .select();

    if (error) throw error;

    res.status(201).json({ 
      success: true, 
      message: 'Command sent to robot',
      commandId: data[0].id
    });

  } catch (error) {
    console.error('Command Error:', error);
    res.status(500).json({ error: error.message });
  }
};