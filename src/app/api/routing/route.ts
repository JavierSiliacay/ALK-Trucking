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

    const oLon = Number(originLon);
    const oLat = Number(originLat);
    const dLon = Number(destLon);
    const dLat = Number(destLat);

    // Build standard coordinate array
    let routeCoordinates = [
      [oLon, oLat],
      [dLon, dLat]
    ];

    // Detect if this is an East-West coastal trip (e.g., CDO to Butuan/Surigao)
    const isEastWestCorridor = (oLon < 124.75 && dLon > 125.0) || (oLon > 125.0 && dLon < 124.75);
    const isNorthernCoast = oLat > 8.40 && dLat > 8.40;
    
    // Detect if this is a North-South Bukidnon trip (e.g., CDO to Valencia/Davao)
    const isNorthSouthCorridor = (oLat > 8.40 && dLat < 8.25) || (oLat < 8.25 && dLat > 8.40);
    // Constrain to Central Mindanao longitude band so it doesn't trigger on other islands
    const isCentralMindanao = oLon > 124.4 && oLon < 125.6 && dLon > 124.4 && dLon < 125.6;
    
    if (isEastWestCorridor && isNorthernCoast) {
      // Inject Salay Coastal Waypoint (Route 9) to force bypass of Claveria mountain road
      const coastalWaypoint = [124.810, 8.910];
      routeCoordinates = [
        [oLon, oLat],
        coastalWaypoint,
        [dLon, dLat]
      ];
      console.log("Injected coastal waypoint to avoid Claveria Route 955");
    } else if (isNorthSouthCorridor && isCentralMindanao) {
      // Inject Manolo Fortich Waypoint (Sayre Highway) to force bypass of Talakag mountain pass
      const sayreHighwayWaypoint = [124.817, 8.366]; // Manolo Fortich coordinates
      routeCoordinates = [
        [oLon, oLat],
        sayreHighwayWaypoint,
        [dLon, dLat]
      ];
      console.log("Injected Sayre Highway waypoint to avoid Talakag");
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
            coordinates: routeCoordinates
          })
        });
        
        console.log("ORS Response Status:", res.status);
        if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
             const routes = data.features.map((f: any) => ({
                distance: f.properties.summary.distance,
                geometry: f.geometry
             }));
             return NextResponse.json({ routes, source: 'ors' });
          }
        } else {
          const errData = await res.text();
          console.error("ORS API Error Response:", errData);
        }
      } catch (orsError) {
        console.warn("OpenRouteService failed or timed out, falling back to Mapbox...", orsError);
      }
    }

    // 2. Try Mapbox or fallback to free OSRM (Car profile)
    // Convert coordinate array to string: lon,lat;lon,lat;...
    const coordsString = routeCoordinates.map(c => `${c[0]},${c[1]}`).join(';');
    
    let fallbackUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&alternatives=3`;
    
    if (mapboxToken) {
      fallbackUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?alternatives=true&geometries=geojson&overview=full&access_token=${mapboxToken}`;
    }

    const res = await fetch(fallbackUrl);
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
