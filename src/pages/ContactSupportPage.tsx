import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, CheckCircle2, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function ContactSupportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Custom Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | null>(null);

  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      showToast("Please complete all required fields before submitting.", "error");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-support-message", {
        body: {
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      showToast("Your message has been sent. Our support team will contact you soon.", "success");
      setForm({ name: user?.user_metadata?.full_name || "", email: user?.email || "", subject: "", message: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to send message. Please try again later.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 relative">
      <div className="max-w-md mx-auto mt-12 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-sm p-6 space-y-6">
        
        {/* Back Button */}
        <div className="flex items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
        
        {/* Custom Toast Notification */}
        <div 
          className={`fixed top-6 right-6 z-50 transition-all duration-300 ease-in-out transform ${
            toastVisible ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0 pointer-events-none"
          }`}
        >
          {toastType === "success" && (
            <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg shadow-md flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
          )}
          {toastType === "error" && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
          )}
        </div>

        {/* Header Section */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Get Help</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">Need help with Connectly? Send us a message and our support team will respond soon.</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full h-10 px-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-gray-100 focus:outline-none transition-shadow"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full h-10 px-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-gray-100 focus:outline-none transition-shadow"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
            <select
              id="subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
              className="w-full h-10 px-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 dark:text-gray-100 transition-shadow"
            >
              <option value="" disabled>Choose a support topic</option>
              <option value="General Question">General Question</option>
              <option value="Technical Issue">Technical Issue</option>
              <option value="Account Help">Account Help</option>
              <option value="Feature Request">Feature Request</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
            <textarea
              id="message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Describe your issue or question here..."
              required
              className="w-full min-h-[120px] px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-gray-100 focus:outline-none transition-shadow resize-y"
            />
          </div>

          <div className="pt-2">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center sm:text-left">
              Our support team usually responds within 24 hours.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
