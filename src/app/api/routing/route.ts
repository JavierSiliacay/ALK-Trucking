import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const originLon = searchParams.get('originLon');
    const originLat = searchParams.get('originLat');
    const destLon = searchParams.get('destLon');
    const destLat = searchParams.get('destLat');

    if (!originLon || !originLat || !destLon || !destLat) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // Securely read tokens from the server environment
    const orsToken = process.env.ORS_TOKEN || process.env.NEXT_PUBLIC_ORS_TOKEN;
    const mapboxToken = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    // 1. Try OpenRouteService (Best for Trucks - HGV profile)
    if (orsToken) {
      try {
        const url = `https://api.openrouteservice.org/v2/directions/driving-hgv/geojson`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': orsToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            coordinates: [[Number(originLon), Number(originLat)], [Number(destLon), Number(destLat)]],
            alternative_routes: { target_count: 3, weight_factor: 1.4 }
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
             const routes = data.features.map((f: any) => ({
                distance: f.properties.summary.distance,
                geometry: f.geometry
             }));
             return NextResponse.json({ routes, source: 'ors' });
          }
        }
      } catch (orsError) {
        console.warn("OpenRouteService failed or timed out, falling back to OSRM...", orsError);
      }
    }

    // 2. Try Mapbox or fallback to free OSRM (Car profile)
    let url = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson&alternatives=3`;
    
    if (mapboxToken) {
      url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLon},${originLat};${destLon},${destLat}?alternatives=true&geometries=geojson&overview=full&access_token=${mapboxToken}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    
    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      return NextResponse.json({ routes: data.routes, source: mapboxToken ? 'mapbox' : 'osrm' });
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  } catch (error: any) {
    console.error("Routing API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
