"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Truck, Shield, ArrowRight, Loader2, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/admin" });
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT — Brand Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden hero-gradient flex-col justify-between p-12">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute -bottom-40 left-20 w-[350px] h-[350px] rounded-full bg-white/5 blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
            <img src="/alk_logo.jpg" alt="ALK Trucking" className="w-12 h-12 object-contain" />
          </div>
          <div>
            <p className="text-white font-manrope font-bold text-lg tracking-wide">ALK Trucking</p>
            <p className="text-blue-200 text-xs tracking-widest uppercase font-medium">Management System</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/80 text-xs font-medium tracking-wide">Fleet Operations Online</span>
            </div>
            <h1 className="text-5xl font-manrope font-bold text-white leading-tight mb-6">
              Your Fleet.<br />
              <span className="text-blue-300">Your Control.</span>
            </h1>
            <p className="text-blue-100/80 text-lg leading-relaxed max-w-md">
              Centralized platform for managing truck operations, trip monitoring,
              driver assignments, costing, and financial reporting.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="mt-12 flex flex-wrap gap-3"
          >
            {["Fleet Tracking", "Trip Management", "Driver Payroll", "Cost Analysis", "Reports"].map((f) => (
              <div
                key={f}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/80 text-sm font-medium"
              >
                {f}
              </div>
            ))}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
            className="mt-12 grid grid-cols-3 gap-6"
          >
            {[
              { label: "Fleet Modules", value: "14" },
              { label: "Real-time Data", value: "Live" },
              { label: "Reports", value: "∞" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-manrope font-bold text-white">{s.value}</p>
                <p className="text-blue-200/70 text-xs mt-1 tracking-wide">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center gap-2 text-white/40 text-xs">
          <MapPin className="w-3 h-3" />
          <span>Cagayan de Oro City, Philippines</span>
          <span className="mx-2">·</span>
          <span>© {new Date().getFullYear()} ALK Trucking</span>
        </div>
      </div>

      {/* RIGHT — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <img src="/alk_logo.jpg" alt="ALK Trucking" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-manrope font-bold text-[#1e3a8a]">ALK Trucking</p>
              <p className="text-xs text-slate-500">Management System</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 mb-5">
              <Shield className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span className="text-[#1e3a8a] text-xs font-semibold">Authorized Personnel Only</span>
            </div>
            <h2 className="text-3xl font-manrope font-bold text-[#0f172a] mb-2">Welcome back</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Sign in with your authorized Google account to access the ALK Trucking Management System.
            </p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-[#1e3a8a] hover:bg-blue-50/50 text-slate-700 font-semibold py-4 px-6 rounded-xl transition-all duration-300 group shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            id="btn-google-signin"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#1e3a8a]" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
            {!isLoading && (
              <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-[#1e3a8a] group-hover:translate-x-1 transition-all" />
            )}
          </button>

          {/* Divider info */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-amber-800 text-xs font-semibold mb-1">Restricted Access</p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  This system is restricted to ALK Trucking staff and administrators only. 
                  Unauthorized access is prohibited.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-slate-400 text-xs">
              © {new Date().getFullYear()} ALK Trucking · Cagayan de Oro City
            </p>
            <p className="text-slate-300 text-xs mt-1">v1.0.0</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
