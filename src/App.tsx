import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/context/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";

// Normalize important imports for performance & faster initial load
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

// Normal imports for lightweight/public pages
import PublicProfilePage from "@/pages/PublicProfilePage";
import AboutPage from "@/pages/AboutPage";
import FeaturesPage from "@/pages/FeaturesPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import VerifyPasswordUpdatePage from "@/pages/VerifyPasswordUpdatePage";

// Lazy load heavy/secondary pages
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

// Loading fallback component for per-route Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// Optimized React Query settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
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

function PublicAppLayout() {
  return (
    <PublicRoute>
      <Outlet />
    </PublicRoute>
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
              {/* Public/Auth Routes - Synchronous rendering for fast initial load */}
              <Route element={<PublicAppLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Public Informational Pages - Synchronous to avoid lazy loading overhead */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/profile/:username" element={<PublicProfilePage />} />
              
              {/* Protected Routes - Heavy pages safely lazy loaded with per-route Suspense */}
              <Route element={<ProtectedAppLayout />}>
                <Route path="/dashboard" element={
                  <Suspense fallback={<PageLoader />}>
                    <AppDashboard />
                  </Suspense>
                } />
                <Route path="/dashboard/contacts/:id" element={
                  <Suspense fallback={<PageLoader />}>
                    <ContactDetailView />
                  </Suspense>
                } />
                <Route path="/dashboard/interactions" element={
                  <Suspense fallback={<PageLoader />}>
                    <InteractionsPage />
                  </Suspense>
                } />
                <Route path="/dashboard/messages" element={
                  <Suspense fallback={<PageLoader />}>
                    <MessagesPage />
                  </Suspense>
                } />
                <Route path="/dashboard/video-meetings" element={
                  <Suspense fallback={<PageLoader />}>
                    <VideoMeetingsPage />
                  </Suspense>
                } />
                <Route path="/dashboard/reminders" element={
                  <Suspense fallback={<PageLoader />}>
                    <RemindersPage />
                  </Suspense>
                } />
                <Route path="/dashboard/network" element={
                  <Suspense fallback={<PageLoader />}>
                    <NetworkMapPage />
                  </Suspense>
                } />
                <Route path="/dashboard/settings" element={
                  <Suspense fallback={<PageLoader />}>
                    <AccountSettingsPage />
                  </Suspense>
                } />
                <Route path="/dashboard/profile-settings" element={
                  <Suspense fallback={<PageLoader />}>
                    <ProfileSettingsPage />
                  </Suspense>
                } />
                <Route path="/dashboard/change-password" element={
                  <Suspense fallback={<PageLoader />}>
                    <ChangePasswordPage />
                  </Suspense>
                } />
                <Route path="/dashboard/profile" element={
                  <Suspense fallback={<PageLoader />}>
                    <MyProfilePage />
                  </Suspense>
                } />
                <Route path="/dashboard/follow-ups" element={
                  <Suspense fallback={<PageLoader />}>
                    <FollowUpsPage />
                  </Suspense>
                } />
                <Route path="/dashboard/recent-interactions" element={
                  <Suspense fallback={<PageLoader />}>
                    <RecentInteractionsPage />
                  </Suspense>
                } />
                <Route path="/dashboard/insights" element={
                  <Suspense fallback={<PageLoader />}>
                    <NetworkingInsightsPage />
                  </Suspense>
                } />
                <Route path="/help" element={
                  <Suspense fallback={<PageLoader />}>
                    <HelpCenterPage />
                  </Suspense>
                } />
                <Route path="/report-issue" element={
                  <Suspense fallback={<PageLoader />}>
                    <ReportIssuePage />
                  </Suspense>
                } />
                <Route path="/support" element={
                  <Suspense fallback={<PageLoader />}>
                    <ContactSupportPage />
                  </Suspense>
                } />
              </Route>
              
              <Route path="/verify-password-update" element={<VerifyPasswordUpdatePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
