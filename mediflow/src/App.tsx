import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/Home";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminDepartments from "@/pages/admin/Departments";
import AdminDoctors from "@/pages/admin/Doctors";
import AdminAnalytics from "@/pages/admin/Analytics";
import DoctorDashboard from "@/pages/doctor/Dashboard";
import PatientRegister from "@/pages/patient/Register";
import PatientQueue from "@/pages/patient/Queue";
import Triage from "@/pages/Triage";
import Appointments from "@/pages/Appointments";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 30000, // Auto-refresh data every 30 seconds
      retry: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/departments" component={AdminDepartments} />
      <Route path="/admin/doctors" component={AdminDoctors} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/doctor/:id" component={DoctorDashboard} />
      <Route path="/patient/register" component={PatientRegister} />
      <Route path="/patient/queue/:tokenId" component={PatientQueue} />
      <Route path="/triage" component={Triage} />
      <Route path="/appointments" component={Appointments} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class" forcedTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
