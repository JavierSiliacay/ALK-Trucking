"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";

export default function MaintenancePlaceholder() {
  const staggerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  };

  return (
    <div className="w-full h-[calc(100vh-120px)] min-h-[600px] bg-[#001430] rounded-3xl overflow-hidden flex shadow-2xl border border-white/5 relative">
      
      {/* Left Content Area (Strictly solid background for perfect text readability) */}
      <div className="w-full lg:w-1/2 p-10 md:p-16 lg:p-24 flex flex-col justify-center relative z-20 bg-[#001430]">
        
        {/* Subtle glowing orb behind text for depth */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

        <motion.div 
          variants={staggerVariants}
          initial="hidden"
          animate="show"
          className="relative space-y-8"
        >
          {/* Icon */}
          <motion.div variants={fadeUpVariants}>
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
               <Settings className="text-blue-400 w-8 h-8 animate-[spin_4s_linear_infinite]" />
            </div>
          </motion.div>
          
          <motion.div variants={fadeUpVariants} className="space-y-4">
            <h2 className="text-blue-400 font-bold tracking-[0.2em] text-xs uppercase">
              Access Restricted
            </h2>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Module <br/> Unavailable.
            </h1>
          </motion.div>

          <motion.p variants={fadeUpVariants} className="text-slate-400 text-lg leading-relaxed max-w-md">
            The Fleet Maintenance module is currently unavailable as it is actively undergoing development. Thank you for your patience while this new feature is being prepared.
          </motion.p>

          <motion.div variants={fadeUpVariants} className="pt-6">
            <Link 
              href="/admin/trucks" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:-translate-y-1"
            >
              <ArrowLeft className="w-5 h-5" /> 
              Return to Dashboard
            </Link>
          </motion.div>

        </motion.div>
      </div>

      {/* Right Image Area (Hidden on small screens) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-[#00193c]">
        {/* Gradient mask to blend the image seamlessly into the left solid color */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001430] via-[#001430]/60 to-transparent z-10" />
        
        {/* Dark overlay to ensure the image isn't too distracting */}
        <div className="absolute inset-0 bg-[#001430]/30 z-10" />
        
        {/* The actual background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url('/truck-bg.jpg')` }}
        />
      </div>

    </div>
  );
}
