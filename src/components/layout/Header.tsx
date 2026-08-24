"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const LOGO_URL = "/alk_logo.jpg";

// All 11 frames used in a narrative loop:
// idle → wave → wave high → drive → hold sun (morning!) → jump excited → star eyes →
// idle → blink → confused → sleepy → back to idle → wave again
const ANIMATION_SEQUENCE = [
  1,           // idle
  2, 3, 2, 3,  // wave hello
  1,           // idle
  5,           // driving fast
  6,           // holding sun / winking
  7,           // both arms up jumping
  11,          // star eyes excited
  1, 1,        // idle pause
  4,           // blink
  1,           // idle
  8,           // confused moment
  9,           // sad/confused
  10, 10,      // sleepy zzZ
  1,           // wake back up
  2, 3,        // wave goodbye / restart
];
const FRAME_DURATION_MS = 220;

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)  return { text: "Good morning",  emoji: "🌅" };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", emoji: "☀️" };
  return                               { text: "Good evening",  emoji: "🌙" };
}

export default function Header() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Cycle through the animation sequence
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % ANIMATION_SEQUENCE.length);
    }, FRAME_DURATION_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const currentFrame = ANIMATION_SEQUENCE[frameIndex];
  const frameSrc = `/trucker-animation/frame${currentFrame}.png`;
  const { text: greetingText, emoji } = getGreeting();
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 w-full h-14 bg-white border-b border-[#c4c6d1] shadow-xs no-print">
      {/* Left: Logo + Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_URL} alt="ALK Trucking Logo" className="h-8 w-8 object-cover rounded-md" />
          <span className="font-extrabold text-base text-[#00193c] font-manrope">ALK Trucking</span>
        </div>
      </div>

      {/* Right: Mascot greeting + Avatar */}
      <div className="flex items-center gap-3">
        {mounted && (
          <div className="flex items-center gap-2.5">
            {/* Animated mascot */}
            <img
              src={frameSrc}
              alt="ALK Trucker mascot"
              className="h-14 w-14 object-contain select-none pointer-events-none drop-shadow-sm"
              draggable={false}
            />
            {/* Greeting text */}
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] text-slate-400 font-medium">
                {emoji} {greetingText},
              </span>
              <span className="text-sm font-black text-[#00193c] leading-tight">
                {firstName || "Admin"}!
              </span>
            </div>
          </div>
        )}

        {/* Avatar — Google profile photo or initial fallback */}
        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#c4c6d1] shadow-xs shrink-0">
          {mounted && session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name ?? "User"}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#00193c] text-white flex items-center justify-center font-extrabold text-xs">
              {mounted && session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "A"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
