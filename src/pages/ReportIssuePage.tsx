import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bug, ArrowLeft, Loader2, UploadCloud, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function ReportIssuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Custom Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | null>(null);

  const [form, setForm] = useState({
    title: "",
    category: "",
    priority: "Medium",
    description: "",
    steps: "",
  });

  const [screenshot, setScreenshot] = useState<File | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.description) {
      showToast("Please complete all required fields before submitting.", "error");
      return;
    }

    setLoading(true);

    try {
      // Build FormData to support file attachments
      const formData = new FormData();
      formData.append("name", user?.user_metadata?.full_name || "User");
      formData.append("email", user?.email || "");
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("priority", form.priority);
      formData.append("description", form.description);
      formData.append("steps", form.steps || "N/A");
      
      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      // Send the request to the backend email processing API
      const response = await fetch("/api/report-issue", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error("Failed to send report");
      }

      showToast("Bug report submitted successfully. Thank you for helping improve Connectly.", "success");
      setForm({ title: "", category: "", priority: "Medium", description: "", steps: "" });
      setScreenshot(null);
    } catch (err: any) {
      showToast("Unable to submit the report. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8 relative">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        
        {/* Custom Toast Notification */}
        <div 
          className={`fixed top-6 right-6 z-50 transition-all duration-300 ease-in-out transform ${
            toastVisible ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0 pointer-events-none"
          }`}
        >
          {toastType === "success" && (
            <div className="bg-blue-50 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg shadow-md flex items-center gap-2">
              <Bug className="h-5 w-5 text-blue-600" />
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Bug className="h-6 w-6 text-red-600" />
              </div>
              <h1 className="text-2xl font-semibold text-red-600">Report a Bug</h1>
            </div>
            <p className="text-gray-500 text-sm">Found something not working correctly? Let us know so we can fix it.</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Bug Title</label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="E.g. Cannot save contact details"
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:outline-none transition-shadow"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Bug Category</label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white transition-shadow"
              >
                <option value="" disabled>Select category</option>
                <option value="UI Bug">UI Bug</option>
                <option value="Performance Issue">Performance Issue</option>
                <option value="Login Issue">Login Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority Level</label>
              <select
                id="priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white transition-shadow"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What happened? What were you expecting?"
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:outline-none transition-shadow min-h-[100px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="steps" className="block text-sm font-medium text-gray-700">Steps to Reproduce</label>
            <textarea
              id="steps"
              value={form.steps}
              onChange={(e) => setForm({ ...form, steps: e.target.value })}
              placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:outline-none transition-shadow min-h-[100px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Screenshot (Optional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-red-400 transition-colors bg-gray-50/50 relative">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm justify-center text-gray-600">
                  <label
                    htmlFor="screenshot-upload"
                    className="relative cursor-pointer rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus:outline-none"
                  >
                    <span>Upload a file</span>
                    <input
                      id="screenshot-upload"
                      name="screenshot-upload"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG up to 10MB
                </p>
                {screenshot && (
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    Selected: {screenshot.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit Bug Report"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
