const token = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjE2NjllYzdmNTViYTRiOGJhODEyZjFkNjI3NjZiNDFmIiwiaCI6Im11cm11cjY0In0=';
const url = 'https://api.openrouteservice.org/v2/directions/driving-hgv/geojson';

async function testApiKey() {
  console.log('Testing OpenRouteService API Key...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // CDO to a nearby location for a quick test
        coordinates: [[124.6459, 8.4772], [124.6500, 8.4800]],
        alternative_routes: { target_count: 3, weight_factor: 1.4 }
      })
    });
    
    const data = await res.json();
    
    if (res.ok && data.features) {
      console.log(`\n✅ SUCCESS! The API key is working perfectly.`);
      console.log(`✅ Found ${data.features.length} route(s).`);
    } else {
      console.log('\n❌ ERROR: The API key might be invalid or there is an issue.');
      console.log('Response Details:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('\n❌ NETWORK ERROR:', error.message);
  }
}

testApiKey();
