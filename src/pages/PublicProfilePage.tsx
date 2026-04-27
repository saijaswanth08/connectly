import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Linkedin, Instagram, UserPlus, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function PublicProfilePage() {
  const { id: profileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
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

  // 6. CLEAN URL FUNCTION
  const cleanUrl = (url: string | undefined | null) => {
    if (!url) return "";
    // remove everything after "?"
    return url.split("?")[0];
  };

  const linkedinUrl = cleanUrl((profile as any).linkedin_url || (profile as any).linkedin);
  const instagramUrl = cleanUrl(profile.instagram);
  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : "U";

  // 3. DOWNLOAD CONTACT (.VCF)
  const handleDownloadVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.name || ""}
TEL:${profile.phone || ""}
EMAIL:${profile.email || ""}
URL:${linkedinUrl || ""}
URL:${instagramUrl || ""}
END:VCARD`;

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
        navigate("/login");
        return;
      }

      console.log("USER:", user);

      // Show confirmation popup: "Do you want to save this contact?"
      if (!window.confirm("Do you want to save this contact?")) {
        return;
      }

      // Prevent duplicates: Check user_id + email
      if (profile.email) {
        const { data: existing, error: checkError } = await supabase
          .from("contacts")
          .select("id")
          .eq("user_id", user.id)
          .eq("email", profile.email)
          .maybeSingle();

        if (checkError) {
          console.log("CHECK ERROR:", checkError);
          throw checkError;
        }

        if (existing) {
          alert("Contact already saved");
          return;
        }
      }

      // Else: Insert into "contacts" table
      const payload = {
        user_id: user.id,
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        linkedin: linkedinUrl || "",
        instagram: instagramUrl || "",
        company: profile.company || "",
        job_title: profile.job_title || "",
      };

      const { error } = await supabase.from("contacts").insert(payload);

      if (error) {
        console.log("INSERT ERROR:", error);
        alert(error.message);
        return;
      }

      alert("Contact saved ✅");
    } catch (error: any) {
      console.error("Error saving contact:", error);
      alert(error.message || "Failed to save contact");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:py-12 font-sans">
      {/* Centered card layout (mobile-first) */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Profile Card Header */}
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
          
          {/* Name & Job Title */}
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

          {/* Email & Phone */}
          <div className="w-full space-y-4 mb-6 text-left">
            {profile.email && (
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-5 h-5 text-indigo-500" />
                <span className="text-[15px] font-medium truncate">
                  {profile.email}
                </span>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-5 h-5 text-emerald-500" />
                <span className="text-[15px] font-medium">
                  {profile.phone}
                </span>
              </div>
            )}
          </div>

          <hr className="w-full border-slate-100 mb-6" />

          {/* Social Links (Buttons) */}
          <div className="w-full space-y-3 mb-6">
            {linkedinUrl && (
              <a 
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-slate-50 hover:bg-[#0A66C2]/5 transition-colors border border-slate-100 hover:border-[#0A66C2]/20 text-slate-700 hover:text-[#0A66C2] font-medium"
              >
                <Linkedin className="w-5 h-5" />
                LinkedIn Profile
              </a>
            )}

            {instagramUrl && (
              <a 
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-slate-50 hover:bg-pink-50 transition-colors border border-slate-100 hover:border-pink-200 text-slate-700 hover:text-pink-600 font-medium"
              >
                <Instagram className="w-5 h-5" />
                Instagram Profile
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
      
      {/* Branding */}
      <div className="mt-6 text-center">
        <p className="text-xs font-medium text-slate-400">
          Powered by <span className="text-indigo-500">Connectly</span>
        </p>
      </div>
    </div>
  );
}

