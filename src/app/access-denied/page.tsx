import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Info } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/truck-bg.jpg')" }}
    >
      {/* Dark overlays to ensure text remains readable and image feels cinematic */}
      <div className="absolute inset-0 bg-[#000a1a]/80 mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#000a1a] via-[#000a1a]/60 to-transparent pointer-events-none" />

      {/* Subtle Grid overlay for structural feel */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px' 
        }} 
      />

      <div className="relative z-10 w-full max-w-lg mt-12 sm:mt-16">
        
        {/* Floating ALK Badge (Overlapping the card) */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-white p-1.5 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-100 flex items-center justify-center relative group">
            <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Image 
              src="/alk_logo.jpg" 
              alt="ALK Trucking Logo" 
              width={76} 
              height={76} 
              className="rounded-[1.1rem] relative z-10 shadow-inner"
              priority
            />
          </div>
        </div>

        {/* The Ultra-Premium Main Card */}
        <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 rounded-[2rem] pt-14 pb-10 px-6 sm:px-10 w-full text-center relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 fade-in shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
          
          {/* Brand Name */}
          <h2 className="text-lg sm:text-xl font-black text-[#00193c] tracking-tight drop-shadow-sm mb-6 mt-1">
            ALK Trucking Services
          </h2>

          {/* Typography Hierarchy */}
          <p className="text-rose-600 font-extrabold text-[10px] sm:text-xs tracking-[0.2em] uppercase mb-3">
            Security Checkpoint
          </p>
          <h1 className="text-3xl sm:text-[2.5rem] leading-none font-black text-slate-900 tracking-tight mb-8">
            Access Denied
          </h1>

          {/* Premium Horizontal Alert Box */}
          <div className="bg-rose-50/50 border border-rose-100/80 rounded-2xl p-5 mb-8 flex items-start gap-4 text-left shadow-sm shadow-rose-100/20 group hover:bg-rose-50 transition-colors">
            {/* Pulsing Shield Icon */}
            <div className="w-10 h-10 rounded-xl bg-white border border-rose-200 shadow-sm flex items-center justify-center shrink-0 relative">
              <div className="absolute inset-0 rounded-xl animate-ping bg-rose-200/30" style={{ animationDuration: '3s' }}></div>
              <ShieldAlert className="w-5 h-5 text-rose-600 relative z-10" />
            </div>
            
            {/* Warning Content */}
            <div className="flex-1 pt-0.5">
              <h3 className="text-rose-950 font-bold text-sm mb-1">
                Unauthorized Account
              </h3>
              <p className="text-rose-800/80 font-medium leading-relaxed text-xs sm:text-[13px]">
                We couldn't verify your access with this Google account. This usually happens if you're logged into a personal email instead of your authorized work account.
              </p>
              <p className="text-rose-800/80 font-medium leading-relaxed text-xs sm:text-[13px] mt-2">
                Please try returning to the login page to select a different account, or contact the systems administrator to request access.
              </p>
            </div>
          </div>

          {/* Tactile Action Button */}
          <Link href="/login" className="w-full block mt-2">
            <button className="w-full relative group bg-[#00193c] text-white font-extrabold text-sm sm:text-[15px] rounded-xl py-4 px-6 overflow-hidden flex items-center justify-center gap-3 transition-all duration-300 hover:bg-[#002255] hover:-translate-y-[2px] shadow-[0_10px_20px_-10px_rgba(0,25,60,0.6)] border-t border-[#335580] border-x border-[#00122e] border-b border-[#000a1a]">
              <ArrowLeft className="w-5 h-5 relative z-10 group-hover:-translate-x-1 transition-transform opacity-90" />
              <span className="relative z-10 tracking-wide">Return to Login</span>
            </button>
          </Link>
          
        </div>
      </div>
    </div>
  );
}
