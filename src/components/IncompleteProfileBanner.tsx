import { useProfile } from "@/hooks/useProfile";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export function IncompleteProfileBanner() {
  const { data: profile, isLoading } = useProfile();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || !profile || dismissed) return null;

  // Check if important details are missing
  const isProfileIncomplete = !profile.company || !profile.job_title || !profile.phone;

  if (!isProfileIncomplete) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm z-20 relative">
      <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          Please complete your profile details (company, role, etc.) to generate your QR code and message connections.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link 
          to="/dashboard/profile-settings" 
          className="flex items-center gap-1.5 text-sm font-semibold text-amber-900 dark:text-amber-100 bg-amber-200/50 dark:bg-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-800 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
        >
          Complete Profile
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button 
          onClick={() => setDismissed(true)}
          className="p-1 rounded-full hover:bg-amber-200/50 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-300 transition-colors"
          title="Dismiss for now"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
