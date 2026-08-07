const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function fix() {
  const trucks = await sql`SELECT id, plate_no FROM trucks`;
  const maintenance = await sql`SELECT id, description, autoworx_job_id FROM maintenance_records WHERE autoworx_job_id IS NOT NULL AND truck_id IS NULL`;
  
  const normalize = (s) => (s || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  
  // Hardcoded mappings based on known Autoworx data
  const historicalAutoworxPlates = {
    'MOCKGBMV-A2YLMM': 'CCO 7161 ',
    'MRXAHVES-HCEUQ9': 'AAX  4163',
    'MRPZQ1BE-YD0CKY': 'CAM 3663.',
    'MSA4T8ZZ-D1ZZH2': 'KCW 2752' // Typo for KCW 272
  };
  
  for (const record of maintenance) {
    let plateNo = historicalAutoworxPlates[record.autoworx_job_id];
    if (!plateNo) continue;
    
    // Fix typo manually for this known record
    if (record.autoworx_job_id === 'MSA4T8ZZ-D1ZZH2') plateNo = 'KCW 272';
    
    const normalizedIncoming = normalize(plateNo);
    const truckMatch = trucks.find(t => normalize(t.plate_no) === normalizedIncoming);
    
    if (truckMatch) {
      console.log(`Fixing ${record.autoworx_job_id} -> ${truckMatch.plate_no}`);
      await sql`UPDATE maintenance_records SET truck_id = ${truckMatch.id} WHERE id = ${record.id}`;
    }
  }
  console.log("Fix complete!");
}

fix().catch(console.error);
