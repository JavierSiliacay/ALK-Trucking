import React from "react";
import FleetClient from "@/components/fleet/FleetClient";
import { getFleetPerformance } from "@/actions/fleet";

export const dynamic = "force-dynamic";

export default async function TrucksPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string, dateRange?: string, month?: string, year?: string, day?: string, customStart?: string, customEnd?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams.status || "active";
  const dateRange = resolvedSearchParams.dateRange || "monthly";
  
  const now = new Date();
  const month = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : now.getMonth();
  const year = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : now.getFullYear();
  
  // Daily and Custom Range
  const day = resolvedSearchParams.day || now.toISOString().split("T")[0];
  const customStart = resolvedSearchParams.customStart || now.toISOString().split("T")[0];
  const customEnd = resolvedSearchParams.customEnd || now.toISOString().split("T")[0];

  let startDate: Date | undefined = undefined;
  let endDate: Date | undefined = undefined;
  
  if (dateRange === "daily") {
    startDate = new Date(`${day}T00:00:00`);
    endDate = new Date(`${day}T23:59:59`);
  } else if (dateRange === "monthly") {
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 0, 23, 59, 59);
  } else if (dateRange === "yearly") {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
  } else if (dateRange === "custom") {
    startDate = new Date(`${customStart}T00:00:00`);
    endDate = new Date(`${customEnd}T23:59:59`);
  } else if (dateRange === "overall") {
    // Leave undefined to fetch all
  }

  const performance = await getFleetPerformance(startDate, endDate, status);

  return (
    <FleetClient 
      trucks={performance} 
      initialStatus={status}
      initialDateRange={dateRange}
      initialMonth={month}
      initialYear={year}
      initialDay={day}
      initialCustomStart={customStart}
      initialCustomEnd={customEnd}
    />
  );
}
