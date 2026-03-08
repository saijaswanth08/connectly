import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface JitsiMeetingRoomProps {
  roomId: string;
  onLeave: () => void;
  title?: string;
}

export function JitsiMeetingRoom({ roomId, onLeave, title }: JitsiMeetingRoomProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useIsMobile();
  const meetingUrl = `https://meet.jit.si/${roomId}`;

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

  const jitsiConfig = [
    "config.prejoinConfig.enabled=false",
    "config.startWithVideoMuted=false",
    "config.startWithAudioMuted=true",
    "config.disableDeepLinking=true",
    "config.toolbarButtons=[\"microphone\",\"camera\",\"desktop\",\"chat\",\"participants-pane\",\"raisehand\",\"tileview\",\"hangup\",\"fullscreen\"]",
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
    "interfaceConfig.DEFAULT_BACKGROUND=#0F172A",
    "interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=false",
  ].join("&");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-4rem)] -m-6 bg-[#0F172A] text-white overflow-hidden"
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

      {/* Jitsi iframe */}
      <div className="flex-1 relative">
        <iframe
          src={`${meetingUrl}#${jitsiConfig}`}
          className="absolute inset-0 w-full h-full"
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          style={{ border: "none" }}
          title="Video Meeting"
        />
      </div>
    </motion.div>
  );
}
