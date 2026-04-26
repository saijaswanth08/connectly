import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Linkedin, Instagram, UserPlus, Download } from "lucide-react";

export default function PublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

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

  const linkedinUrl = cleanUrl((profile as any).linkedin_url || (profile as any).linkedin);
  const instagramUrl = cleanUrl(profile.instagram);
  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : "U";

  // 1. DOWNLOAD CONTACT (.VCF)
  const handleDownloadVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.name || ""}
TEL:${profile.phone || ""}
EMAIL:${profile.email || ""}
${linkedinUrl ? `URL;type=LinkedIn:${linkedinUrl}\n` : ""}${instagramUrl ? `URL;type=Instagram:${instagramUrl}\n` : ""}END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.name || "contact"}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. SAVE CONTACT FEATURE
  const handleSaveContact = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login if not logged in
        navigate("/login");
        return;
      }

      // Confirmation popup
      if (!window.confirm("Do you want to save this contact?")) {
        return;
      }

      // Duplicate check: using email/name instead of contact_id to respect existing DB schema
      const query = supabase.from("contacts").select("id").eq("user_id", user.id);
      if (profile.email) {
        query.eq("email", profile.email);
      } else {
        query.eq("name", profile.name);
      }

      const { data: existing } = await query;

      if (existing && existing.length > 0) {
        alert("Contact already saved");
        return;
      }

      // Insert into contacts table
      // Omitting contact_id from payload as it is not in the database schema 
      // (Respecting STRICT RULE: DO NOT change database schema)
      const payload = {
        user_id: user.id, // owner_id (logged-in user)
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        linkedin: linkedinUrl || "",
        instagram: instagramUrl || "",
        company: profile.company || "",
        job_title: profile.job_title || "",
      };

      const { error } = await supabase.from("contacts").insert(payload as any);

      if (error) throw error;

      alert("Contact saved successfully!");
    } catch (error) {
      console.error("Error saving contact:", error);
      alert("Failed to save contact");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:py-12 font-sans">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
        </div>
        
        <div className="px-6 pb-6 flex flex-col items-center text-center -mt-14">
          
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-indigo-50 flex items-center justify-center overflow-hidden mb-3 relative z-10">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-3xl font-bold text-indigo-500">{initial}</span>
            )}
          </div>
          
          {/* Name & Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">
            {profile.name}
          </h1>
          
          {(profile.job_title || profile.company) && (
            <p className="text-sm text-slate-500 font-medium mb-6">
              {profile.job_title && <span>{profile.job_title}</span>}
              {profile.job_title && profile.company && <span> @ </span>}
              {profile.company && <span className="text-slate-700">{profile.company}</span>}
            </p>
          )}

          <hr className="w-full border-slate-100 mb-6" />

          {/* Contact Details */}
          <div className="w-full space-y-4 mb-6 text-left">
            {profile.email && (
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-5 h-5 text-indigo-500" />
                <a href={`mailto:${profile.email}`} className="text-[15px] font-medium hover:text-indigo-600 truncate">
                  {profile.email}
                </a>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-5 h-5 text-emerald-500" />
                <a href={`tel:${profile.phone}`} className="text-[15px] font-medium hover:text-emerald-600">
                  {profile.phone}
                </a>
              </div>
            )}
          </div>

          {(linkedinUrl || instagramUrl) && <hr className="w-full border-slate-100 mb-6" />}

          {/* Social Links */}
          <div className="w-full space-y-3 mb-6 text-left">
            {linkedinUrl && (
              <a 
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-[#0A66C2]/5 transition-colors border border-slate-100 hover:border-[#0A66C2]/20 text-slate-700 hover:text-[#0A66C2]"
              >
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                <span className="font-medium text-[14px]">LinkedIn Profile</span>
              </a>
            )}

            {instagramUrl && (
              <a 
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-pink-50 transition-colors border border-slate-100 hover:border-pink-200 text-slate-700 hover:text-pink-600"
              >
                <Instagram className="w-5 h-5 text-pink-500" />
                <span className="font-medium text-[14px]">Instagram Profile</span>
              </a>
            )}
          </div>

          <hr className="w-full border-slate-100 mb-6" />

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button 
              onClick={handleSaveContact}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5" />
              {isSaving ? "Saving..." : "Save Contact"}
            </button>
            
            <button 
              onClick={handleDownloadVCard}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-3.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              <Download className="w-5 h-5" />
              Download Contact
            </button>
          </div>
          
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs font-medium text-slate-400">
          Powered by <span className="text-indigo-500">Connectly</span>
        </p>
      </div>
    </div>
  );
}

