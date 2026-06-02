import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  ExternalLink,
  Maximize2,
  Minimize2,
  Shield,
  FileText,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface JitsiMeetingRoomProps {
  roomId: string;
  onLeave: () => void;
  title?: string;
  meetingId?: string | null;
  initialNotes?: string;
}

export function JitsiMeetingRoom({ roomId, onLeave, title, meetingId, initialNotes = "" }: JitsiMeetingRoomProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(() => {
    // Automatically pop up the notes panel by default on mobile viewports
    return typeof window !== "undefined" && window.innerWidth < 768;
  });
  const [notes, setNotes] = useState(initialNotes);
  const [isLeaving, setIsLeaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const meetingUrl = `https://konferenz.netzbegruenung.de/${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const saveNotes = useCallback(async (value: string) => {
    if (!meetingId) return;
    setSaveStatus("saving");
    try {
      await supabase.from("meetings").update({ notes: value }).eq("id", meetingId);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }, [meetingId]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setSaveStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNotes(value), 2000);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Add meeting-active class to body and html when meeting room is mounted to hide sidebars and headers and lock viewport height
  useEffect(() => {
    document.body.classList.add("meeting-active");
    document.documentElement.classList.add("meeting-active");
    return () => {
      document.body.classList.remove("meeting-active");
      document.documentElement.classList.remove("meeting-active");
    };
  }, []);

  // Reset scroll position on mount and counteract any automatic browser focus scrolling
  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      const mainElement = document.querySelector("main") || document.querySelector(".main-viewport-scroll");
      if (mainElement) {
        mainElement.scrollTop = 0;
        mainElement.scrollLeft = 0;
      }
      const appLayout = document.querySelector(".flex-1.flex.flex-col");
      if (appLayout) {
        appLayout.scrollTop = 0;
      }
    };

    // Reset immediately on mount
    resetScroll();

    // Repeatedly reset for the first 2.5 seconds to counteract Jitsi autofocus scroll shifts
    const interval = setInterval(resetScroll, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Listen for Jitsi's built-in hangup/end-call button → return to dashboard
  useEffect(() => {
    const handleJitsiMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        
        const isReadyToClose = 
          data?.name === "readyToClose" ||
          data?.action === "readyToClose" ||
          data?.type === "readyToClose" ||
          data?.event === "readyToClose" ||
          data?.name === "videoConferenceLeft" ||
          data?.action === "videoConferenceLeft" ||
          data?.type === "videoConferenceLeft" ||
          data?.event === "videoConferenceLeft" ||
          (typeof event.data === "string" && (event.data.includes("readyToClose") || event.data.includes("videoConferenceLeft")));

        if (isReadyToClose) {
          console.log("[JitsiMeetingRoom] Received readyToClose/videoConferenceLeft event, leaving meeting immediately.");
          setIsLeaving(true);
          onLeave();
        }
      } catch {
        // ignore non-JSON messages
      }
    };
    window.addEventListener("message", handleJitsiMessage);
    return () => window.removeEventListener("message", handleJitsiMessage);
  }, [onLeave]);

  // Detect meeting end via iframe reload:
  // Jitsi navigates the iframe back to its lobby/home page when the user
  // clicks the hangup button. We track load count — first load = meeting
  // started, second+ load = meeting ended → auto-leave.
  const iframeLoadCount = useRef(0);
  const handleIframeLoad = () => {
    iframeLoadCount.current += 1;
    if (iframeLoadCount.current > 1) {
      // Jitsi reloaded → meeting has ended
      setIsLeaving(true);
      onLeave();
    } else {
      // Force scroll reset on initial iframe load to ensure perfect alignment
      window.scrollTo(0, 0);
      const mainElement = document.querySelector("main") || document.querySelector(".main-viewport-scroll");
      if (mainElement) {
        mainElement.scrollTop = 0;
      }
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "User";
  const email = user?.email || "";

  const jitsiConfig = [
    "config.prejoinConfig.enabled=false",
    "config.prejoinPageEnabled=false",
    "config.startWithVideoMuted=false",
    "config.startWithAudioMuted=true",
    "config.disableDeepLinking=true",
    "config.enableClosePage=true",
    "config.welcomePageEnabled=false",
    "config.alwaysVisibleToolbar=true",
    "config.toolbarConfig.alwaysVisible=true",
    "config.toolbarConfig.timeout=31536000",
    "config.toolbarConfig.initialTimeout=31536000",
    "interfaceConfig.TOOLBAR_ALWAYS_VISIBLE=true",
    "interfaceConfig.TOOLBAR_TIMEOUT=31536000",
    "config.toolbarButtons=[\"microphone\",\"camera\",\"desktop\",\"chat\",\"participants-pane\",\"raisehand\",\"tileview\",\"hangup\",\"fullscreen\"]",
    "interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=false",
    `userInfo.displayName="${displayName}"`,
    ...(email ? [`userInfo.email="${email}"`] : []),
  ].join("&");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full w-full bg-[#0F172A] text-white overflow-hidden"
    >
      {/* Meeting Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F172A]/95 border-b border-white/10 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-white/70 hover:text-white hover:bg-white/10 shrink-0"
            onClick={onLeave}
          >
            <ArrowLeft className="h-4 w-4" />
            {!isMobile && "Leave"}
          </Button>

          <div className="h-5 w-px bg-white/20 shrink-0" />

          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">
              {title || "Connectly Meeting"}
            </h2>
            <p className="text-[11px] text-white/50 truncate font-mono">
              {roomId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/50 mr-2">
            <Shield className="h-3 w-3" />
            <span>Encrypted</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/50 bg-white/5 rounded-full px-2.5 py-1 mr-1">
            <Users className="h-3 w-3" />
            <span>Up to 30</span>
          </div>

          {/* Notes Toggle Button */}
          {meetingId && (
            <Button
              size="sm"
              variant="ghost"
              className={`gap-1.5 h-8 px-2.5 text-xs transition-colors ${notesOpen ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              onClick={() => setNotesOpen(!notesOpen)}
            >
              <FileText className="h-3.5 w-3.5" />
              {!isMobile && "Notes"}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-white/70 hover:text-white hover:bg-white/10 h-8 px-2.5 text-xs"
            onClick={copyLink}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {!isMobile && (copied ? "Copied!" : "Copy Link")}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
            asChild
          >
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Area: Jitsi + Notes Panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Jitsi iframe */}
        <div className={`flex-1 relative min-w-0 transition-opacity duration-150 ${isLeaving ? "opacity-0 pointer-events-none" : ""}`}>
          <iframe
            src={`${meetingUrl}#${jitsiConfig}`}
            className="absolute inset-0 w-full h-full"
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
            style={{ border: "none" }}
            title="Video Meeting"
            onLoad={handleIframeLoad}
          />
        </div>

        {/* Notes Side Panel */}
        {notesOpen && meetingId && (
          <motion.div
            initial={isMobile ? { y: "100%", opacity: 0 } : { width: 0, opacity: 0 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { width: 320, opacity: 1 }}
            exit={isMobile ? { y: "100%", opacity: 0 } : { width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={
              isMobile
                ? "absolute bottom-0 left-0 right-0 z-20 w-full h-[38%] flex flex-col border-t border-white/10 bg-[#0a0f1e]/90 backdrop-blur-md rounded-t-2xl shadow-2xl overflow-hidden"
                : "flex flex-col border-l border-white/10 bg-[#0a0f1e] shrink-0 overflow-hidden"
            }
            style={isMobile ? { height: "38%" } : { width: 320 }}
          >
            {/* Grab Handle for Mobile Bottom Sheet */}
            {isMobile && (
              <div className="flex justify-center pt-2.5 shrink-0">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
              </div>
            )}

            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Meeting Notes</span>
              </div>
              <div className="flex items-center gap-2">
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1 text-[11px] text-white/40">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Saved
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-white/40 hover:text-white hover:bg-white/10"
                  onClick={() => setNotesOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Notes Textarea */}
            <div className="flex-1 p-3 overflow-hidden flex flex-col">
              <Textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder={"Type your notes here...\n\n• Key discussion points\n• Decisions made\n• Action items"}
                className="flex-1 resize-none bg-white/5 border-white/10 text-white/90 text-sm placeholder:text-white/25 focus-visible:ring-blue-500/50 rounded-xl leading-relaxed min-h-0 h-full font-mono"
              />
              <p className="mt-2 text-[10px] text-white/25 text-center">
                Notes auto-save as you type
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
