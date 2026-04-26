import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Linkedin, Instagram } from "lucide-react";

export default function PublicProfilePage() {
  const { id } = useParams();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-800">Profile Not Found</h2>
          <p className="text-slate-500">This profile doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Utility to clean URLs by removing query parameters
  const cleanUrl = (url: string | undefined | null) => {
    if (!url) return "";
    try {
      const withProtocol = url.startsWith("http") ? url : `https://${url}`;
      const parsed = new URL(withProtocol);
      return parsed.origin + parsed.pathname;
    } catch {
      return url.split("?")[0];
    }
  };

  const linkedinUrl = cleanUrl((profile as any).linkedin);
  const instagramUrl = cleanUrl(profile.instagram);
  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:py-12 font-sans">
      {/* 1. Main Container (Static Layout) */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Banner Background */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
        </div>
        
        <div className="px-8 pb-8 flex flex-col items-center text-center -mt-16">
          
          {/* 2. Avatar Section */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg bg-indigo-50 flex items-center justify-center overflow-hidden mb-4 relative z-10">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-4xl font-bold text-indigo-500">{initial}</span>
            )}
          </div>
          
          {/* 3. Name + Role */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1.5 tracking-tight">
            {profile.name}
          </h1>
          
          {(profile.job_title || profile.company) && (
            <p className="text-sm sm:text-base text-slate-500 font-medium mb-8 flex flex-wrap justify-center gap-1">
              {profile.job_title && <span>{profile.job_title}</span>}
              {profile.job_title && profile.company && <span>at</span>}
              {profile.company && <span className="text-slate-700">{profile.company}</span>}
            </p>
          )}

          {/* 4. & 5. Contact Info & Social Links */}
          <div className="w-full space-y-3">
            
            {profile.email && (
              <a 
                href={`mailto:${profile.email}`}
                className="group flex items-center gap-4 w-full p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-all duration-200 border border-slate-100 hover:border-indigo-100 text-slate-700 hover:text-indigo-700 hover:shadow-sm"
              >
                <div className="bg-white p-2.5 rounded-lg shadow-sm text-indigo-500 group-hover:scale-110 transition-transform duration-200">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="font-medium text-[15px] truncate">{profile.email}</span>
              </a>
            )}

            {profile.phone && (
              <a 
                href={`tel:${profile.phone}`}
                className="group flex items-center gap-4 w-full p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 transition-all duration-200 border border-slate-100 hover:border-emerald-100 text-slate-700 hover:text-emerald-700 hover:shadow-sm"
              >
                <div className="bg-white p-2.5 rounded-lg shadow-sm text-emerald-500 group-hover:scale-110 transition-transform duration-200">
                  <Phone className="w-5 h-5" />
                </div>
                <span className="font-medium text-[15px]">{profile.phone}</span>
              </a>
            )}

            {linkedinUrl && (
              <a 
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 w-full p-3.5 rounded-xl bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 transition-all duration-200 border border-[#0A66C2]/10 hover:border-[#0A66C2]/20 text-slate-700 hover:text-[#0A66C2] hover:shadow-sm"
              >
                <div className="bg-white p-2.5 rounded-lg shadow-sm text-[#0A66C2] group-hover:scale-110 transition-transform duration-200">
                  <Linkedin className="w-5 h-5" />
                </div>
                <span className="font-medium text-[15px]">LinkedIn Profile</span>
              </a>
            )}

            {instagramUrl && (
              <a 
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 w-full p-3.5 rounded-xl bg-pink-500/5 hover:bg-pink-500/10 transition-all duration-200 border border-pink-500/10 hover:border-pink-500/20 text-slate-700 hover:text-pink-600 hover:shadow-sm"
              >
                <div className="bg-white p-2.5 rounded-lg shadow-sm text-pink-500 group-hover:scale-110 transition-transform duration-200">
                  <Instagram className="w-5 h-5" />
                </div>
                <span className="font-medium text-[15px]">Instagram</span>
              </a>
            )}

          </div>
          
        </div>
      </div>
      
      {/* Subtle branding footer */}
      <div className="mt-8 text-center">
        <p className="text-xs font-medium text-slate-400">
          Powered by <span className="text-indigo-500">Connectly</span>
        </p>
      </div>
    </div>
  );
}
