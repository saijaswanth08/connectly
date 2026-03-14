import { QRCodeCanvas } from "qrcode.react";
import { ConnectlyLogoIcon } from "./ConnectlyLogo";
import { cn } from "@/lib/utils";

interface QRProfileCardProps {
  id: string;
  qrValue: string;
  fullName: string;
}

export function QRProfileCard({ id, qrValue, fullName }: QRProfileCardProps) {
  return (
    <div
      id={id}
      className="fixed -left-[2000px] top-0 w-[900px] h-[1100px] flex flex-col items-center justify-center p-16 font-sans overflow-hidden bg-[#0a0a0c]"
      style={{ isolation: 'isolate' }}
    >
      {/* Dark Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2c] via-[#4a192c] to-[#0a0a0c]" />
      
      {/* Decorative Blur Spheres for added depth */}
      <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px]" />

      {/* Main Glassmorphism Card */}
      <div className="relative w-full max-w-[650px] aspect-[9/11] flex flex-col items-center justify-center gap-10 p-12 rounded-[48px] backdrop-blur-2xl bg-white/5 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] text-center">
        
        {/* Top Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <ConnectlyLogoIcon size={56} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white/90">Connectly</h1>
        </div>

        {/* Middle Section */}
        <div className="space-y-2">
          <h2 className="text-[32px] font-semibold text-white tracking-tight">
            {fullName}
          </h2>
          <p className="text-lg font-medium text-white/40 tracking-wide">
            Connect with me on Connectly
          </p>
        </div>

        {/* QR Section */}
        <div className="relative my-2">
          <div className="absolute -inset-4 bg-white/5 rounded-[32px] blur-xl opacity-30" />
          <div className="relative bg-white p-6 rounded-[24px] shadow-2xl">
            <QRCodeCanvas
              value={qrValue}
              size={280}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex flex-col items-center gap-5 mt-2">
          <p className="text-lg font-medium text-white/60">
            Scan to connect
          </p>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <ConnectlyLogoIcon size={14} />
            <span className="text-xs font-semibold text-white/30 tracking-[0.2em] uppercase">connectly.app</span>
          </div>
        </div>
      </div>
    </div>
  );
}

