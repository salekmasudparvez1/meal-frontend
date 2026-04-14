import { Layout } from "@/components/layout";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Role } from "@/lib/api-client";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import StudentProfile from "@/pages/student-profile";
import Meals from "@/pages/meals";
import Deposits from "@/pages/deposits";
import BazarLists from "@/pages/bazar";
import BazarListDetails from "@/pages/bazar-list";
import Reports from "@/pages/reports";
import AdminUsers from "@/pages/admin/users";
import Manager from "@/pages/manager";
import Unauthorized from "@/pages/unauthorized";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();



// Protected Route Component
function ProtectedRoute({ 
  component: Component, 
  allowedRoles, 
  ...rest 
}: { 
  component: React.ComponentType<any>, 
  allowedRoles?: Role[], 
  [key: string]: any 
}) {
  const { user, isLoading, hasRole } = useAuth();



  if (isLoading) return null; // handled by AuthProvider skeleton

  if (!user) {
  
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
   
    return <Unauthorized />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();



  if (isLoading) {
    return null;
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/" /> : <Login />}
      </Route>

      {user?.role === Role.USER ? (
        <Route>
          <Layout>
            <Switch>
              <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
              <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
              <Route>
                <Redirect to="/" />
              </Route>
            </Switch>
          </Layout>
        </Route>
      ) : null}
      
      <Route>
        {user ? (
          <Layout>
            <Switch>
              <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
              <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
              
              <Route path="/students" component={() => <ProtectedRoute component={Students} allowedRoles={[Role.SUPER_ADMIN, Role.MEAL_MANAGER]} />} />
              <Route path="/students/:studentId">
                {(params) => <ProtectedRoute component={StudentProfile} params={params} />}
              </Route>
              
              <Route path="/meals" component={() => <ProtectedRoute component={Meals} allowedRoles={[Role.SUPER_ADMIN, Role.MEAL_MANAGER]} />} />
              <Route path="/deposits" component={() => <ProtectedRoute component={Deposits} allowedRoles={[Role.SUPER_ADMIN, Role.MEAL_MANAGER]} />} />
              
              <Route path="/bazar" component={() => <ProtectedRoute component={BazarLists} allowedRoles={[Role.SUPER_ADMIN, Role.MEAL_MANAGER]} />} />
              <Route path="/bazar/:id">
                {(params) => <ProtectedRoute component={BazarListDetails} allowedRoles={[Role.SUPER_ADMIN, Role.MEAL_MANAGER]} params={params} />}
              </Route>
              
              <Route path="/reports" component={() => <ProtectedRoute component={Reports} allowedRoles={[Role.SUPER_ADMIN, Role.MEAL_MANAGER]} />} />
              
              <Route path="/manager" component={() => <ProtectedRoute component={Manager} allowedRoles={[Role.SUPER_ADMIN, Role.MEAL_MANAGER]} />} />
              <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsers} allowedRoles={[Role.SUPER_ADMIN]} />} />
              
              <Route component={NotFound} />
            </Switch>
          </Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
    </Switch>
  );
}

function MainApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default MainApp;
