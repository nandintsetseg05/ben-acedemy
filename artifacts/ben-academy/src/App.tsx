import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/auth";
import { useEffect } from "react";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import TestList from "@/pages/TestList";
import TestRoom from "@/pages/TestRoom";
import Grading from "@/pages/Grading";
import SubmissionReview from "@/pages/SubmissionReview";
import Upgrade from "@/pages/Upgrade";
import TeacherMarketplace from "@/pages/TeacherMarketplace";
import TeacherDetail from "@/pages/TeacherDetail";
import TeacherDashboard from "@/pages/TeacherDashboard";
import StudentBookings from "@/pages/StudentBookings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated } = useAuthStore();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/teachers" component={TeacherMarketplace} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/tests">
        {() => <ProtectedRoute component={TestList} />}
      </Route>
      <Route path="/tests/:testId/room/:submissionId">
        {() => <ProtectedRoute component={TestRoom} />}
      </Route>
      <Route path="/submissions/:id/grading">
        {() => <ProtectedRoute component={Grading} />}
      </Route>
      <Route path="/submissions/:id">
        {() => <ProtectedRoute component={SubmissionReview} />}
      </Route>
      <Route path="/upgrade">
        {() => <ProtectedRoute component={Upgrade} />}
      </Route>
      <Route path="/teachers/:id">
        {() => <ProtectedRoute component={TeacherDetail} />}
      </Route>
      <Route path="/teacher-dashboard">
        {() => <ProtectedRoute component={TeacherDashboard} />}
      </Route>
      <Route path="/my-bookings">
        {() => <ProtectedRoute component={StudentBookings} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
