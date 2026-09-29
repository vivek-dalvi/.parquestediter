"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, Heart, ShieldCheck, Database, FileCode, Layers } from "lucide-react";

export const DevcartFooter: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl py-10 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-between">
          {/* Brand & Devcart Logo */}
          <div className="md:col-span-6 flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 p-0.5 shadow-xl">
                <Image
                  src="https://i.ibb.co/8D1FTxPx/devcart-technologies-logo.jpg"
                  alt="Devcart Technologies Logo"
                  width={46}
                  height={46}
                  className="object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm tracking-tight">
                  Parquet Dataset Studio
                </span>
                <span className="px-2 py-0.2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono">
                  v1.0.0
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Engineered & Made by{" "}
                <strong className="text-slate-200 font-semibold">
                  Devcart Technologies
                </strong>{" "}
                • Copyright © 2026 Vivek Dalvi
              </p>
            </div>
          </div>

          {/* Capabilities Badges */}
          <div className="md:col-span-6 flex flex-wrap items-center md:justify-end gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Apache Parquet Spec</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Hugging Face Ready</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Client-Side Privacy</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>
            Open source MIT License • Built for ML Engineers, OCR Dataset Curators & Hugging Face Creators
          </span>
          <span className="flex items-center gap-1">
            Handcrafted with <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" /> by Devcart Technologies
          </span>
        </div>
      </div>
    </footer>
  );
};
