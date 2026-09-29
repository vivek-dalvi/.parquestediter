"use client";

import React from "react";
import Image from "next/image";
import {
  Heart,
  ShieldCheck,
  Database,
  Layers,
  Globe,
  Mail,
  ExternalLink,
  Code2,
} from "lucide-react";

export const DevcartFooter: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl py-12 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-between">
          {/* Brand & Devcart Logo */}
          <div className="md:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a
              href="https://devcart-technologies.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group block shrink-0"
              title="Visit Devcart Technologies"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 p-0.5 shadow-2xl group-hover:scale-105 transition transform">
                <Image
                  src="https://i.ibb.co/8D1FTxPx/devcart-technologies-logo.jpg"
                  alt="Devcart Technologies Logo"
                  width={56}
                  height={56}
                  className="object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </a>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white font-bold text-base tracking-tight">
                  Parquet Dataset Studio
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-semibold">
                  v1.0.0 • Open Source
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Engineered & Developed by{" "}
                <a
                  href="https://devcart-technologies.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-100 hover:text-blue-400 font-semibold underline decoration-blue-500/50 underline-offset-2 transition"
                >
                  Devcart Technologies
                </a>{" "}
                • Lead Developer: <strong className="text-slate-200">Vivek Dalvi</strong>
              </p>

              {/* Direct links: Website & Email */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                <a
                  href="https://devcart-technologies.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>https://devcart-technologies.in/</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                <a
                  href="mailto:info@devcart-technologies.in"
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>info@devcart-technologies.in</span>
                </a>
              </div>
            </div>
          </div>

          {/* Capabilities Badges */}
          <div className="md:col-span-5 flex flex-wrap items-center md:justify-end gap-2.5 text-[11px]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Apache Parquet Spec</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Hugging Face Ready</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Client Privacy</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>
            Released under the MIT License • Copyright © 2026 Vivek Dalvi / Devcart Technologies.
          </span>
          <span className="flex items-center gap-1">
            Handcrafted with <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" /> by Devcart Technologies
          </span>
        </div>
      </div>
    </footer>
  );
};
