import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AboutPage from "@/pages/AboutPage";
import FeaturesPage from "@/pages/FeaturesPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import AppDashboard from "@/pages/AppDashboard";
import ContactDetailView from "@/pages/ContactDetailView";
import MeetingsPage from "@/pages/MeetingsPage";
import VideoMeetingsPage from "@/pages/VideoMeetingsPage";
import HelpCenterPage from "@/pages/HelpCenterPage";
import ReportIssuePage from "@/pages/ReportIssuePage";
import ContactSupportPage from "@/pages/ContactSupportPage";
import RemindersPage from "./pages/RemindersPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedAppLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route element={<ProtectedAppLayout />}>
                <Route path="/dashboard" element={<AppDashboard />} />
                <Route path="/dashboard/contacts/:id" element={<ContactDetailView />} />
              <Route path="/dashboard/meetings" element={<MeetingsPage />} />
              <Route path="/dashboard/video-meetings" element={<VideoMeetingsPage />} />
              <Route path="/dashboard/reminders" element={<RemindersPage />} />
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/report-issue" element={<ReportIssuePage />} />
              <Route path="/support" element={<ContactSupportPage />} />
            </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
