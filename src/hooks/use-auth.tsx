import { createContext, useContext, ReactNode, useMemo, useCallback, useEffect, useState } from "react";
import { useGetCurrentUser, useLogout, UserAccount, Role, getGetCurrentUserQueryKey, setAuthTokenGetter } from "@/lib/api-client";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

const authDebug = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log("[auth]", ...args);
  }
};

interface AuthContextType {
  user: UserAccount | null;
  isLoading: boolean;
  logout: () => void;
  isSuperAdmin: boolean;
  isMealManager: boolean;
  isUser: boolean;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseUserUid, setFirebaseUserUid] = useState<string | null>(null);

  useEffect(() => {
    setAuthTokenGetter(async () => {
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        authDebug("token getter: no firebase currentUser");
        return null;
      }

      authDebug("token getter: requesting ID token", { uid: currentUser.uid });
      return currentUser.getIdToken();
    });

    return () => setAuthTokenGetter(null);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      authDebug("firebase auth state changed", {
        uid: currentUser?.uid ?? null,
        email: currentUser?.email ?? null,
      });
      setFirebaseUserUid(currentUser?.uid ?? null);
      setFirebaseReady(true);
    });
  }, []);

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    authDebug("auth dependency changed, clearing current-user query", {
      firebaseReady,
      firebaseUserUid,
    });
    queryClient.removeQueries({ queryKey: getGetCurrentUserQueryKey() });
  }, [firebaseReady, firebaseUserUid, queryClient]);

  const {
    data: session,
    isLoading: isSessionLoading,
    isError,
    error,
  } = useGetCurrentUser({
    query: {
      retry: 1,
      queryKey: getGetCurrentUserQueryKey(),
      enabled: firebaseReady,
    },
  });

  const logoutMutation = useLogout();

  const hasSessionUser = Boolean(session?.user);
  const user = hasSessionUser ? session!.user : null;
  const isLoading = !firebaseReady || isSessionLoading;

  const authStatus =
    isError &&
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (((error as { status?: number }).status ?? 0) === 401 ||
      ((error as { status?: number }).status ?? 0) === 403)
      ? "unauthorized"
      : "unknown";

  useEffect(() => {
    authDebug("auth state snapshot", {
      firebaseReady,
      firebaseUserUid,
      isSessionLoading,
      hasSessionUser,
      userRole: user?.role ?? null,
      isError,
      authStatus,
      isLoading,
    });
  }, [
    firebaseReady,
    firebaseUserUid,
    isSessionLoading,
    hasSessionUser,
    user,
    isError,
    authStatus,
    isLoading,
  ]);

  useEffect(() => {
    if (!firebaseUserUid || authStatus !== "unauthorized") {
      return;
    }

    authDebug("received unauthorized from backend, forcing firebase signOut", {
      firebaseUserUid,
    });
    void signOut(firebaseAuth);
  }, [authStatus, firebaseUserUid]);

  const handleLogout = useCallback(() => {
    void (async () => {
      authDebug("manual logout started");
      await Promise.allSettled([signOut(firebaseAuth), logoutMutation.mutateAsync()]);
      authDebug("manual logout finished, clearing query cache and redirecting");
      queryClient.clear();
      setLocation("/login");
    })();
  }, [logoutMutation, queryClient, setLocation]);

  const hasRole = useCallback((roles: Role[]) => {
    if (!user) return false;
    return roles.includes(user.role as Role);
  }, [user]);

  // Derived state memoized for performance
  const value = useMemo(() => ({
    user,
    isLoading,
    logout: handleLogout,
    isSuperAdmin: user?.role === Role.SUPER_ADMIN,
    isMealManager: user?.role === Role.MEAL_MANAGER,
    isUser: user?.role === Role.USER,
    hasRole,
  }), [user, isLoading, handleLogout, hasRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}