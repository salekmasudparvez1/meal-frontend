import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home } from "lucide-react";

export default function Unauthorized() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <ShieldAlert className="h-16 w-16 text-destructive" />
      </div>
      <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Access Denied</h1>
      <p className="text-muted-foreground max-w-md mb-8 text-lg">
        Sorry, your role ({user?.role}) does not have permission to view this page or perform this action.
      </p>
      <Link href="/">
        <Button className="gap-2" size="lg">
          <Home className="h-5 w-5" />
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
