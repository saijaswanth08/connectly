import { motion } from "framer-motion";
import { Calendar, FileText, Bell, Users, ChevronLeft, MoreVertical, ChevronRight, Battery, Wifi, Signal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MobileHeroMockup() {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative w-full aspect-[9/19.5] bg-[#F8FAFC] rounded-[2.5rem] border-[6px] border-white shadow-2xl overflow-hidden flex flex-col font-sans mb-8"
    >
      {/* Top Status Bar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-slate-900 bg-white">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <Signal className="w-3.5 h-3.5 fill-current" />
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-4 h-4" />
        </div>
      </div>
      
      {/* Dynamic Island / Notch Fake */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />

      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between relative z-10">
        <ChevronLeft className="w-5 h-5 text-slate-800" strokeWidth={2.5} />
        <MoreVertical className="w-4 h-4 text-slate-800" strokeWidth={2.5} />
      </div>

      {/* Profile Section */}
      <div className="bg-white px-5 pt-3 pb-0 flex flex-col relative z-10">
        <div className="flex items-center gap-4">
          <Avatar className="w-[4.5rem] h-[4.5rem] border-2 border-white shadow-sm">
            <AvatarImage src="https://i.pravatar.cc/150?img=47" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <div className="flex-1 pt-1">
            <h3 className="font-semibold text-[17px] text-slate-900 leading-tight">Sarah Chen</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-2">Product Lead at Acme Inc.</p>
            <span className="inline-block px-2 py-0.5 bg-blue-100/80 text-blue-700 text-[10px] font-semibold rounded-full">
              Client
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mt-6 border-b border-slate-100">
          <button className="pb-2.5 px-1 text-[11px] font-bold text-primary border-b-[2.5px] border-primary">Overview</button>
          <button className="pb-2.5 px-1 text-[11px] font-medium text-slate-500">Notes</button>
          <button className="pb-2.5 px-1 text-[11px] font-medium text-slate-500">Meetings</button>
          <button className="pb-2.5 px-1 text-[11px] font-medium text-slate-500">Tasks</button>
          <button className="pb-2.5 px-1 text-[11px] font-medium text-slate-500">Files</button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 bg-[#F8FAFC] p-4 space-y-3 relative z-10">
        
        {/* Card 1: Last met */}
        <div className="bg-white rounded-xl p-3.5 flex items-start gap-3.5 shadow-sm shadow-slate-200/50 border border-slate-100/60">
          <div className="w-9 h-9 rounded-lg bg-purple-100/80 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="pt-0.5">
            <p className="text-[12px] font-semibold text-slate-900 leading-none mb-1">Last met</p>
            <p className="text-[11px] text-slate-500">May 20, 2025 • 2 weeks ago</p>
          </div>
        </div>

        {/* Card 2: Notes */}
        <div className="bg-white rounded-xl p-3.5 flex items-start gap-3.5 shadow-sm shadow-slate-200/50 border border-slate-100/60">
          <div className="w-9 h-9 rounded-lg bg-emerald-100/80 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-[12px] font-semibold text-slate-900 leading-none mb-1.5">Notes</p>
            <p className="text-[11px] text-slate-500 leading-snug">Discussed partnership opportunities. Interested in long-term collaboration.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
        </div>

        {/* Card 3: Next follow-up */}
        <div className="bg-white rounded-xl p-3.5 flex items-center justify-between shadow-sm shadow-slate-200/50 border border-slate-100/60">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-purple-100/80 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-slate-900 leading-none mb-1">Next follow-up</p>
              <p className="text-[11px] text-slate-500">Next Tuesday, 10:00 AM</p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-semibold rounded-full border border-purple-100">
            Upcoming
          </span>
        </div>

        {/* Card 4: Connected through */}
        <div className="bg-white rounded-xl p-3.5 flex items-center justify-between shadow-sm shadow-slate-200/50 border border-slate-100/60">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-blue-100/80 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-slate-900 leading-none mb-1">Connected through</p>
              <p className="text-[11px] text-slate-500">James Okafor</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>

      </div>

      {/* Glossy Reflection Overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-[2rem] bg-gradient-to-tr from-white/0 via-white/5 to-white/20 z-30" />
    </motion.div>
  );
}
