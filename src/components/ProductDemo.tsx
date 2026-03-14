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
        <div className="relative w-full h-full flex items-center justify-center p-8">
            <motion.div 
                className="relative z-10 bg-card/40 backdrop-blur-xl border border-white/10 rounded-[40px] p-12 shadow-2xl overflow-hidden max-w-2xl w-full"
                initial={{ rotateY: -20, rotateX: 10, scale: 0.8, opacity: 0 }}
                animate={{ rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
            >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ConnectlyLogoIcon size={200} />
                </div>
                <div className="flex flex-col items-center text-center gap-6">
                    <div className="p-4 bg-primary/10 rounded-2xl">
                        <ConnectlyLogoIcon size={64} />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Connectly</h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        The intelligent workspace for your professional relationships.
                    </p>
                    <div className="flex gap-4 mt-4">
                        {[1, 2, 3].map((i) => (
                            <motion.div 
                                key={i}
                                className="h-12 w-12 rounded-full bg-primary/20 border border-primary/20"
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
      narration: "Organize your interactions with private notes and contact management tools, all while keeping your data secured and personal information protected.",
      component: (
        <div className="relative w-full h-full flex items-center justify-center p-8">
            <motion.div 
                className="relative border border-white/5 rounded-2xl shadow-2xl bg-[#0a0a0c] overflow-hidden aspect-video w-full max-w-4xl"
                initial={{ scale: 0.9, y: 50, opacity: 0, rotateX: 5 }}
                animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Simulated Dashboard UI with PII Blurring */}
                <div className="flex h-full">
                    <div className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-6">
                        <ConnectlyLogoIcon size={24} />
                        <div className="space-y-4">
                            {[Users, Sparkles, Shield].map((Icon, i) => (
                                <Icon key={i} className="h-5 w-5 text-white/20" />
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 p-8">
                        <div className="flex justify-between items-center mb-10">
                            <div className="h-8 w-48 bg-white/5 rounded-lg blur-[6px]" />
                            <div className="h-10 w-32 bg-primary/10 rounded-full border border-primary/20 blur-[4px]" />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                                    <div className="h-12 w-12 rounded-lg bg-white/5 blur-[8px]" />
                                    <div className="h-4 w-full bg-white/10 rounded blur-[4px]" />
                                    <div className="h-4 w-2/3 bg-white/5 rounded blur-[3px]" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 h-48 w-full bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-center">
                            <p className="text-white/20 font-medium tracking-widest">ACTIVITY TIMELINE</p>
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
      narration: "Share your professional profile instantly using a beautifully branded QR code. It's fast, modern, and built for the next generation of networking.",
      component: (
        <div className="relative w-full h-full flex items-center justify-center p-8">
            <motion.div 
                className="relative bg-gradient-to-br from-[#1a1c2c] to-[#0a0a0c] border border-white/10 rounded-[48px] p-8 shadow-2xl max-w-[400px] w-full aspect-[9/11] flex flex-col items-center justify-center gap-8"
                initial={{ rotateY: 45, x: -50, opacity: 0, scale: 0.8 }}
                animate={{ rotateY: [15, -15, 15], x: 0, opacity: 1, scale: 1 }}
                transition={{ 
                    opacity: { duration: 0.8 },
                    scale: { duration: 0.8 },
                    rotateY: { duration: 8, repeat: Infinity, ease: "easeInOut" }
                }}
            >
                <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-[48px]" />
                <div className="relative flex flex-col items-center gap-6 text-center">
                    <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                        <ConnectlyLogoIcon size={40} />
                    </div>
                    <div className="space-y-1">
                        <div className="h-6 w-38 bg-white/20 rounded-md mx-auto blur-[6px]" />
                        <p className="text-sm text-white/30 tracking-widest uppercase mt-2">Connectly Profile</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] shadow-2xl mt-2 relative overflow-hidden group">
                        <QRCodeCanvas 
                            value={window.location.origin}
                            size={160}
                            level="H"
                            includeMargin={false}
                            className="relative z-10"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-4 px-6 py-2 rounded-full bg-white/5 border border-white/10">
                        <span className="text-xs font-semibold text-white/20 tracking-tighter uppercase leading-none">Scan to connect</span>
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
        if (currentScene < scenes.length - 1) {
          setCurrentScene(currentScene + 1);
        } else {
          setIsAutoPlaying(false);
        }
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [currentScene, isAutoPlaying]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-2xl p-4 sm:p-10 overflow-hidden font-body">
      <motion.div 
        className="relative w-full max-w-6xl h-full flex flex-col bg-card border border-border rounded-[40px] shadow-2xl overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
                <ConnectlyLogoIcon size={28} />
                <span className="font-bold text-lg tracking-tight">Product Experience</span>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex gap-2">
                    {scenes.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 transition-all duration-700 rounded-full ${i === currentScene ? 'w-10 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-2 bg-white/10'}`} 
                        />
                    ))}
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>

        {/* Scene Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(3,7,18,1))]">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentScene}
                    className="flex-1"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    {scenes[currentScene].component}
                </motion.div>
            </AnimatePresence>

            {/* Narration Overlay */}
            <div className="p-8 pb-14 flex justify-center">
                <motion.div 
                    key={`narration-${currentScene}`}
                    className="max-w-3xl w-full bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-8 rounded-[32px] text-center space-y-2 relative overflow-hidden shadow-2xl"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    <div className="absolute top-0 left-0 h-1 bg-white/5 w-full">
                        <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 8, ease: "linear" }}
                        />
                    </div>
                    <p className="text-xl sm:text-2xl font-medium leading-relaxed bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent italic tracking-tight">
                        "{scenes[currentScene].narration}"
                    </p>
                </motion.div>
            </div>
        </div>

        {/* Footer Controls */}
        <div className="px-10 py-8 flex items-center justify-between border-t border-white/5 bg-black/40 backdrop-blur-md">
            <button 
                className="text-[10px] tracking-[0.2em] font-bold text-muted-foreground/60 hover:text-white transition-colors flex items-center gap-2"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            >
                <div className={`h-1.5 w-1.5 rounded-full ${isAutoPlaying ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
                {isAutoPlaying ? "AUTOPLAY ACTIVE" : "AUTOPLAY PAUSED"}
            </button>
            <div className="flex gap-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full text-xs uppercase tracking-widest px-6"
                    disabled={currentScene === 0}
                    onClick={() => { setCurrentScene(s => s - 1); setIsAutoPlaying(false); }}
                >
                    Prev
                </Button>
                <Button 
                    size="sm" 
                    className="rounded-full px-10 text-xs uppercase tracking-widest font-bold shadow-lg shadow-primary/20"
                    onClick={() => {
                        if (currentScene < scenes.length - 1) {
                            setCurrentScene(s => s + 1);
                            setIsAutoPlaying(false);
                        } else {
                            onClose();
                        }
                    }}
                >
                    {currentScene === scenes.length - 1 ? "Finish Tour" : "Next Project"}
                </Button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
