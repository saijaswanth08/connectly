import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ConnectlyLogoIcon } from "./ConnectlyLogo";
import { QRCodeCanvas } from "qrcode.react";

interface Scene {
  title: string;
  description: string;
  narration: string;
  component: React.ReactNode;
}

export function ProductDemo({ onClose }: { onClose: () => void }) {
  const [currentScene, setCurrentScene] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const scenes: Scene[] = [
    {
      title: "Welcome to Connectly",
      description: "A professional networking CRM built for modern connections.",
      narration: "Connectly is a professional digital networking platform that helps you manage contacts, build meaningful relationships, and instantly share your profile.",
      component: (
        <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
            <motion.div 
                className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] sm:rounded-[40px] p-6 sm:p-12 shadow-2xl overflow-hidden max-w-2xl w-full text-white"
                initial={{ rotateY: -20, rotateX: 10, scale: 0.8, opacity: 0 }}
                animate={{ rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
            >

                <div className="flex flex-col items-center text-center gap-4 sm:gap-6 relative z-10">
                    <div className="p-3 sm:p-4 bg-blue-500/20 rounded-2xl">
                        <ConnectlyLogoIcon size={48} className="sm:w-[64px] sm:h-[64px] text-blue-400" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Connectly</h1>
                    <p className="text-sm sm:text-xl text-white/70 leading-relaxed max-w-[280px] sm:max-w-none">
                        The intelligent workspace for your professional relationships.
                    </p>
                    <div className="flex gap-4 mt-2 sm:mt-4">
                        {[1, 2, 3].map((i) => (
                            <motion.div 
                                key={i}
                                className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-blue-500/20 border border-blue-500/30"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ delay: i * 0.2, duration: 2, repeat: Infinity }}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
      )
    },
    {
      title: "Intelligent Dashboard",
      description: "All your relationships in one high-fidelity view.",
      narration: "Organize your interactions with private notes and contact management tools, all while keeping your data secured.",
      component: (
        <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
            <motion.div 
                className="relative border border-white/10 rounded-2xl shadow-2xl bg-[#0a0a0c] overflow-hidden aspect-[4/3] sm:aspect-video w-full max-w-4xl"
                initial={{ scale: 0.9, y: 50, opacity: 0, rotateX: 5 }}
                animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Simulated Dashboard UI */}
                <div className="flex h-full">
                    <div className="w-12 sm:w-16 border-r border-white/5 flex flex-col items-center py-4 sm:py-6 gap-4 sm:gap-6 bg-black/20">
                        <ConnectlyLogoIcon size={20} className="sm:w-[24px] sm:h-[24px] text-blue-500" />
                        <div className="space-y-4">
                            {[Users, Sparkles, Shield].map((Icon, i) => (
                                <Icon key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-white/20" />
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 p-4 sm:p-8 overflow-hidden">
                        <div className="flex justify-between items-center mb-6 sm:mb-10">
                            <div className="h-6 sm:h-8 w-24 sm:w-48 bg-white/10 rounded-lg blur-[2px] sm:blur-[6px]" />
                            <div className="h-8 sm:h-10 w-20 sm:w-32 bg-blue-500/20 rounded-full border border-blue-500/30 blur-[2px] sm:blur-[4px]" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-6 space-y-3 sm:space-y-4">
                                    <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg bg-white/10 blur-[4px] sm:blur-[8px]" />
                                    <div className="h-3 sm:h-4 w-full bg-white/20 rounded blur-[2px] sm:blur-[4px]" />
                                    <div className="h-3 sm:h-4 w-2/3 bg-white/10 rounded blur-[2px] sm:blur-[3px]" />
                                </div>
                            ))}
                        </div>
                        <div className="hidden sm:flex mt-8 h-48 w-full bg-white/[0.02] border border-white/5 rounded-xl items-center justify-center">
                            <p className="text-white/20 font-medium tracking-widest text-sm">ACTIVITY TIMELINE</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
      )
    },
    {
      title: "Seamless Sharing",
      description: "Instantly connect with a branded digital identity.",
      narration: "Share your professional profile instantly using a beautifully branded QR code. Built for the next generation of networking.",
      component: (
        <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
            <motion.div 
                className="relative bg-gradient-to-br from-[#1a1c2c] to-[#0a0a0c] border border-white/10 rounded-[32px] sm:rounded-[48px] p-6 sm:p-8 shadow-2xl max-w-[320px] sm:max-w-[400px] w-full aspect-[9/12] sm:aspect-[9/11] flex flex-col items-center justify-center gap-6 sm:gap-8"
                initial={{ rotateY: 45, x: -50, opacity: 0, scale: 0.8 }}
                animate={{ rotateY: [10, -10, 10], x: 0, opacity: 1, scale: 1 }}
                transition={{ 
                    opacity: { duration: 0.8 },
                    scale: { duration: 0.8 },
                    rotateY: { duration: 8, repeat: Infinity, ease: "easeInOut" }
                }}
            >
                <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-[32px] sm:rounded-[48px]" />
                <div className="relative flex flex-col items-center gap-4 sm:gap-6 text-center w-full">
                    <div className="p-2 sm:p-3 bg-white/10 rounded-xl border border-white/20">
                        <ConnectlyLogoIcon size={32} className="sm:w-[40px] sm:h-[40px] text-blue-400" />
                    </div>
                    <div className="space-y-1">
                        <div className="h-4 sm:h-6 w-24 sm:w-32 bg-white/30 rounded-md mx-auto blur-[4px]" />
                        <p className="text-[10px] sm:text-sm text-white/40 tracking-widest uppercase mt-2 font-bold">Connectly Profile</p>
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] shadow-2xl mt-2 relative overflow-hidden group">
                        <QRCodeCanvas 
                            value={window.location.origin}
                            size={120}
                            level="H"
                            includeMargin={false}
                            className="relative z-10"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-2 sm:mt-4 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-white/10 border border-white/20">
                        <span className="text-[10px] sm:text-xs font-bold text-white/50 tracking-wider uppercase leading-none">Scan to connect</span>
                    </div>
                </div>
            </motion.div>
        </div>
      )
    }
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying) {
      timer = setTimeout(() => {
        setCurrentScene((s) => (s < scenes.length - 1 ? s + 1 : 0));
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [currentScene, isAutoPlaying, scenes.length]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-xl p-2 sm:p-10 overflow-hidden font-body">
      <motion.div 
        className="relative w-full max-w-6xl h-[95dvh] sm:h-full flex flex-col bg-slate-950 border border-white/10 rounded-[24px] sm:rounded-[40px] shadow-2xl overflow-hidden"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-white/10 bg-white/5 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
                <ConnectlyLogoIcon size={24} className="sm:w-[28px] sm:h-[28px] text-blue-500" />
                <span className="font-bold text-sm sm:text-lg tracking-tight text-white line-clamp-1">Product Experience</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                <div className="hidden sm:flex gap-2">
                    {scenes.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 transition-all duration-700 rounded-full ${i === currentScene ? 'w-10 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-2 bg-white/20'}`} 
                        />
                    ))}
                </div>
                <button 
                  onClick={onClose}
                  className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
            </div>
        </div>

        {/* Scene Area */}
        <div className="flex-1 min-h-0 relative flex flex-col bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(3,7,18,1))]">
            {/* Scene viewport */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentScene}
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {scenes[currentScene].component}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Narration */}
            <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-5 flex justify-center z-20">
                <motion.div 
                    key={`narration-${currentScene}`}
                    className="max-w-3xl w-full bg-black/40 border border-white/10 backdrop-blur-2xl px-5 sm:px-8 py-4 sm:py-6 rounded-[20px] sm:rounded-[32px] text-center relative overflow-hidden shadow-2xl"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    <div className="absolute top-0 left-0 h-[2px] sm:h-1 bg-white/5 w-full">
                        <motion.div 
                            className="h-full bg-blue-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 8, ease: "linear" }}
                        />
                    </div>
                    <p className="text-sm sm:text-xl font-medium leading-snug sm:leading-relaxed text-white/90 italic tracking-tight">
                        "{scenes[currentScene].narration}"
                    </p>
                </motion.div>
            </div>
        </div>

        {/* Footer Controls */}
        <div className="px-4 sm:px-10 py-4 sm:py-8 flex flex-row items-center justify-between border-t border-white/10 bg-slate-950 shrink-0 gap-2">
            <button 
                className="hidden sm:flex text-[10px] tracking-[0.2em] font-bold text-white/40 hover:text-white transition-colors items-center gap-2"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            >
                <div className={`h-1.5 w-1.5 rounded-full ${isAutoPlaying ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
                {isAutoPlaying ? "AUTOPLAY ACTIVE" : "AUTOPLAY PAUSED"}
            </button>
            <div className="flex gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full text-[10px] sm:text-xs uppercase tracking-widest px-4 sm:px-6 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
                    disabled={currentScene === 0}
                    onClick={() => { setCurrentScene(s => s - 1); }}
                >
                    Prev
                </Button>
                <Button 
                    size="sm" 
                    className="rounded-full px-6 sm:px-10 text-[10px] sm:text-xs uppercase tracking-widest font-bold shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 text-white"
                    onClick={() => {
                        if (currentScene < scenes.length - 1) {
                            setCurrentScene(s => s + 1);
                        } else {
                            if (isAutoPlaying) {
                                setCurrentScene(0);
                            } else {
                                onClose();
                            }
                        }
                    }}
                >
                    {currentScene === scenes.length - 1 ? (isAutoPlaying ? "Experience Again" : "Finish Tour") : "Continue"}
                </Button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
