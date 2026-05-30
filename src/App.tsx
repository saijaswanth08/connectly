import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { AppLayout } from "@/components/AppLayout";

// Normalize important imports for performance & faster initial load
import LandingPage from "@/pages/LandingPage";

// Lazy load secondary public subpages for extremely fast initial page load
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const PublicProfilePage = lazy(() => import("@/pages/PublicProfilePage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const FeaturesPage = lazy(() => import("@/pages/FeaturesPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const VerifyPasswordUpdatePage = lazy(() => import("@/pages/VerifyPasswordUpdatePage"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load heavy/secondary pages
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
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
  <ThemeProvider attribute="class" defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
              {/* Public/Auth Routes - Dynamic lazy-loaded routes with Suspense */}
              <Route element={<PublicAppLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={
                  <Suspense fallback={<PageLoader />}>
                    <LoginPage />
                  </Suspense>
                } />
                <Route path="/signup" element={
                  <Suspense fallback={<PageLoader />}>
                    <SignupPage />
                  </Suspense>
                } />
                <Route path="/forgot-password" element={
                  <Suspense fallback={<PageLoader />}>
                    <ForgotPasswordPage />
                  </Suspense>
                } />
                <Route path="/verify-email" element={
                  <Suspense fallback={<PageLoader />}>
                    <VerifyEmailPage />
                  </Suspense>
                } />
              </Route>

              {/* Reset Password must bypass PublicRoute because the recovery link establishes a temporary session */}
              <Route path="/reset-password" element={
                <Suspense fallback={<PageLoader />}>
                  <ResetPasswordPage />
                </Suspense>
              } />

              {/* Public Informational Pages */}
              <Route path="/about" element={
                <Suspense fallback={<PageLoader />}>
                  <AboutPage />
                </Suspense>
              } />
              <Route path="/features" element={
                <Suspense fallback={<PageLoader />}>
                  <FeaturesPage />
                </Suspense>
              } />
              <Route path="/contact" element={
                <Suspense fallback={<PageLoader />}>
                  <ContactPage />
                </Suspense>
              } />
              <Route path="/privacy-policy" element={
                <Suspense fallback={<PageLoader />}>
                  <PrivacyPolicyPage />
                </Suspense>
              } />
              <Route path="/profile/:id" element={
                <Suspense fallback={<PageLoader />}>
                  <PublicProfilePage />
                </Suspense>
              } />
              
              {/* Protected Routes - Heavy pages safely lazy loaded with per-route Suspense */}
              <Route element={<ProtectedAppLayout />}>
                <Route path="/dashboard" element={
                  <Suspense fallback={<PageLoader />}>
                    <DashboardPage />
                  </Suspense>
                } />
                <Route path="/dashboard/contacts/:id" element={
                  <Suspense fallback={<PageLoader />}>
                    <ContactDetailView />
                  </Suspense>
                } />
                <Route path="/contacts/:id" element={
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
              
              <Route path="/verify-password-update" element={
                <Suspense fallback={<PageLoader />}>
                  <VerifyPasswordUpdatePage />
                </Suspense>
              } />
              <Route path="*" element={
                <Suspense fallback={<PageLoader />}>
                  <NotFound />
                </Suspense>
              } />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
