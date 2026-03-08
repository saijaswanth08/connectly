import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JitsiMeetingRoomProps {
  roomId: string;
  onLeave: () => void;
}

export function JitsiMeetingRoom({ roomId, onLeave }: JitsiMeetingRoomProps) {
  const [copied, setCopied] = useState(false);
  const meetingUrl = `https://meet.jit.si/${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" className="gap-2" onClick={onLeave}>
          <ArrowLeft className="h-4 w-4" /> Leave Meeting
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Up to 30 participants
          </span>
          <code className="hidden sm:inline rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground truncate max-w-[260px]">
            {meetingUrl}
          </code>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={copyLink}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy Link"}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" asChild>
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Open External
            </a>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden shadow-sm bg-card">
        <iframe
          src={`${meetingUrl}#config.prejoinConfig.enabled=false&config.startWithVideoMuted=false&config.startWithAudioMuted=true`}
          className="w-full aspect-video min-h-[500px]"
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          style={{ border: "none" }}
          title="Video Meeting"
        />
      </div>
    </motion.div>
  );
}
