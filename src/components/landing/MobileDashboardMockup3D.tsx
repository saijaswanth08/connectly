import { motion } from "framer-motion";
import { Users, FileText, Bell, Calendar, MessageSquare, Network } from "lucide-react";

export default function MobileDashboardMockup3D() {
  return (
    <div className="relative w-full h-[320px] mt-8 mb-4 perspective-1000 flex items-center justify-center">
      {/* Background blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-10 left-0 w-48 h-48 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob" />
        <div className="absolute bottom-10 right-0 w-48 h-48 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000" />
      </div>

      {/* Dashed background lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
        <path d="M 50 150 Q 150 50 250 200 T 350 100" fill="none" stroke="hsl(263 70% 58% / 0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M 0 250 Q 150 350 200 200 T 350 250" fill="none" stroke="hsl(263 70% 58% / 0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>

      {/* Floating orbital icons */}
      <motion.div
        className="absolute top-[5%] left-[5%] z-20 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 flex items-center justify-center"
        animate={{ y: [-4, 4, -4], rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Users className="w-5 h-5 text-indigo-600" />
      </motion.div>
      <motion.div
        className="absolute bottom-[10%] left-[2%] z-20 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 flex items-center justify-center"
        animate={{ y: [4, -4, 4], rotate: [2, -2, 2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <MessageSquare className="w-5 h-5 text-purple-600" />
      </motion.div>
      <motion.div
        className="absolute top-[40%] right-[0%] z-20 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 flex items-center justify-center"
        animate={{ y: [-3, 3, -3], rotate: [0, 4, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <Calendar className="w-5 h-5 text-blue-600" />
      </motion.div>

      {/* The 3D Dashboard Mockup */}
      <motion.div
        initial={{ rotateX: 10, rotateY: -15, rotateZ: 2, scale: 0.9, opacity: 0, y: 20 }}
        animate={{ rotateX: 10, rotateY: -15, rotateZ: 2, scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-[115%] max-w-[380px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden flex"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Sidebar */}
        <div className="w-[85px] bg-[#F8FAFC] border-r border-slate-100 flex flex-col items-center py-4 gap-4 shrink-0">
          <Network className="w-6 h-6 text-primary mb-2" />
          <div className="flex flex-col gap-3 w-full px-2">
            <div className="h-6 w-full rounded flex items-center gap-1.5 px-2 text-slate-400">
              <div className="w-3 h-3 border border-current rounded-[3px] shrink-0" />
              <div className="h-1.5 w-8 bg-slate-200 rounded-full" />
            </div>
            <div className="h-6 w-full rounded bg-primary/10 flex items-center gap-1.5 px-2 text-primary">
              <Users className="w-3 h-3 shrink-0" />
              <div className="h-1.5 w-10 bg-primary/40 rounded-full" />
            </div>
            <div className="h-6 w-full rounded flex items-center gap-1.5 px-2 text-slate-400">
              <Calendar className="w-3 h-3 shrink-0" />
              <div className="h-1.5 w-9 bg-slate-200 rounded-full" />
            </div>
            <div className="h-6 w-full rounded flex items-center gap-1.5 px-2 text-slate-400">
              <FileText className="w-3 h-3 shrink-0" />
              <div className="h-1.5 w-7 bg-slate-200 rounded-full" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 flex flex-col gap-3 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-900">Good morning, Oliver 👋</p>
              <p className="text-[7px] text-slate-500 mt-0.5">Here's your connections at a glance.</p>
            </div>
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[10px]">
              +
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex gap-2 w-full mt-1">
            <div className="flex-1 bg-white border border-slate-100 rounded-lg p-2 shadow-sm flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-none">128</p>
                <p className="text-[6px] text-slate-500 font-medium">Contacts</p>
              </div>
            </div>
            <div className="flex-1 bg-white border border-slate-100 rounded-lg p-2 shadow-sm flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-emerald-50 flex items-center justify-center shrink-0">
                <FileText className="w-3 h-3 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-none">42</p>
                <p className="text-[6px] text-slate-500 font-medium">Meeting Notes</p>
              </div>
            </div>
            <div className="flex-1 bg-white border border-slate-100 rounded-lg p-2 shadow-sm flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-purple-50 flex items-center justify-center shrink-0">
                <Bell className="w-3 h-3 text-purple-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-none">18</p>
                <p className="text-[6px] text-slate-500 font-medium">Follow-ups</p>
              </div>
            </div>
          </div>

          {/* List Section */}
          <div className="mt-1">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[8px] font-bold text-slate-900">Recent Connections</p>
              <p className="text-[6px] font-semibold text-primary">View all &gt;</p>
            </div>
            <div className="space-y-1.5">
              {/* List Item 1 */}
              <div className="flex items-center gap-2 py-1 border-b border-slate-50">
                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-100 relative">
                  <img src="https://i.pravatar.cc/150?img=47" alt="Sarah" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-green-500 rounded-full border border-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-slate-900 leading-tight">Sarah Chen</p>
                  <p className="text-[6px] text-slate-500">Product Lead at Acme Inc.</p>
                </div>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[6px] font-bold rounded-full">Client</span>
                <span className="text-[6px] text-slate-400 font-medium w-6 text-right">2h ago</span>
              </div>
              {/* List Item 2 */}
              <div className="flex items-center gap-2 py-1 border-b border-slate-50">
                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-100 relative">
                  <img src="https://i.pravatar.cc/150?img=11" alt="James" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-green-500 rounded-full border border-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-slate-900 leading-tight">James Okafor</p>
                  <p className="text-[6px] text-slate-500">Mentor</p>
                </div>
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[6px] font-bold rounded-full">Mentor</span>
                <span className="text-[6px] text-slate-400 font-medium w-6 text-right">1d ago</span>
              </div>
              {/* List Item 3 */}
              <div className="flex items-center gap-2 py-1">
                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-100 relative">
                  <img src="https://i.pravatar.cc/150?img=68" alt="Oliver" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-amber-500 rounded-full border border-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-slate-900 leading-tight">Oliver Smith</p>
                  <p className="text-[6px] text-slate-500">Investor</p>
                </div>
                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[6px] font-bold rounded-full">VIP</span>
                <span className="text-[6px] text-slate-400 font-medium w-6 text-right">3d ago</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
