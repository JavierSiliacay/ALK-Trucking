import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const token = process.env.ORS_TOKEN || process.env.NEXT_PUBLIC_ORS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "No ORS token configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.openrouteservice.org/geocode/autocomplete?api_key=${token}&text=${encodeURIComponent(q)}&boundary.country=PH`);
    if (!res.ok) {
      throw new Error("Failed to fetch autocomplete");
    }
    const data = await res.json();
    
    // Format the results for the frontend
    const results = data.features?.map((feature: any) => {
      const p = feature.properties;
      return {
        id: p.id || Math.random().toString(),
        label: p.label || p.name,
        name: p.name,
        region: p.region,
        county: p.county,
        locality: p.locality,
        coordinates: feature.geometry?.coordinates // [lon, lat]
      };
    }) || [];
    
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Autocomplete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
