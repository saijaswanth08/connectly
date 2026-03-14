import { lazy, Suspense } from "react";
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

// Lazy load pages
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const PublicProfilePage = lazy(() => import("@/pages/PublicProfilePage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const FeaturesPage = lazy(() => import("@/pages/FeaturesPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const AppDashboard = lazy(() => import("@/pages/AppDashboard"));
const ContactDetailView = lazy(() => import("@/pages/ContactDetailView"));
const InteractionsPage = lazy(() => import("@/pages/InteractionsPage"));
const VideoMeetingsPage = lazy(() => import("@/pages/VideoMeetingsPage"));
const HelpCenterPage = lazy(() => import("@/pages/HelpCenterPage"));
const ReportIssuePage = lazy(() => import("@/pages/ReportIssuePage"));
const ContactSupportPage = lazy(() => import("@/pages/ContactSupportPage"));
const RemindersPage = lazy(() => import("./pages/RemindersPage"));
const NetworkMapPage = lazy(() => import("./pages/NetworkMapPage"));
const AccountSettingsPage = lazy(() => import("./pages/AccountSettingsPage"));
const ProfileSettingsPage = lazy(() => import("./pages/ProfileSettingsPage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const MyProfilePage = lazy(() => import("./pages/MyProfilePage"));
const FollowUpsPage = lazy(() => import("./pages/FollowUpsPage"));
const RecentInteractionsPage = lazy(() => import("./pages/RecentInteractionsPage"));
const NetworkingInsightsPage = lazy(() => import("./pages/NetworkingInsightsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const VerifyPasswordUpdatePage = lazy(() => import("./pages/VerifyPasswordUpdatePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/profile/:username" element={<PublicProfilePage />} />
                <Route element={<ProtectedAppLayout />}>
                  <Route path="/dashboard" element={<AppDashboard />} />
                  <Route path="/dashboard/contacts/:id" element={<ContactDetailView />} />
                  <Route path="/dashboard/interactions" element={<InteractionsPage />} />
                  <Route path="/dashboard/messages" element={<MessagesPage />} />
                  <Route path="/dashboard/video-meetings" element={<VideoMeetingsPage />} />
                  <Route path="/dashboard/reminders" element={<RemindersPage />} />
                  <Route path="/dashboard/network" element={<NetworkMapPage />} />
                  <Route path="/dashboard/settings" element={<AccountSettingsPage />} />
                  <Route path="/dashboard/profile-settings" element={<ProfileSettingsPage />} />
                  <Route path="/dashboard/change-password" element={<ChangePasswordPage />} />
                  <Route path="/dashboard/profile" element={<MyProfilePage />} />
                  <Route path="/dashboard/follow-ups" element={<FollowUpsPage />} />
                  <Route path="/dashboard/recent-interactions" element={<RecentInteractionsPage />} />
                  <Route path="/dashboard/insights" element={<NetworkingInsightsPage />} />
                  <Route path="/help" element={<HelpCenterPage />} />
                  <Route path="/report-issue" element={<ReportIssuePage />} />
                  <Route path="/support" element={<ContactSupportPage />} />
                </Route>
                <Route path="/verify-password-update" element={<VerifyPasswordUpdatePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
