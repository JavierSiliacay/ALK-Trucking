"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const LOGO_URL = "/alk_logo.jpg";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 w-full h-14 bg-white border-b border-[#c4c6d1] shadow-xs no-print">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_URL} alt="ALK Trucking Logo" className="h-8 w-8 object-cover rounded-md" />
          <span className="font-extrabold text-base text-[#00193c] font-manrope">ALK Trucking</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-8 h-8 rounded-full border border-[#c4c6d1] overflow-hidden bg-[#00193c] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
            {mounted && session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "J"}
          </div>
        </div>
      </div>
    </header>
  );
}
