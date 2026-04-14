import { getGetCurrentUserQueryKey, getGetCurrentUserQueryOptions } from "@/lib/api-client";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Utensils, Lock, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";


const loginSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

function isCancelledLikeError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("canceled") || msg.includes("cancelled") || msg.includes("aborted");
  }

  return false;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
    

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    const userQueryKey = getGetCurrentUserQueryKey();
    const normalizedEmail = values.email.trim().toLowerCase();

    try {
     
      await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, values.password);
    

      const session = await queryClient.fetchQuery(
        getGetCurrentUserQueryOptions({
          query: {
            queryKey: userQueryKey,
            retry: false,
          },
        }),
      );
     

      queryClient.setQueryData(userQueryKey, session);
      toast({ title: "Login successful", description: "Welcome back!" });
     
      setLocation("/");
    } catch (error) {
     

      // During auth state transition/navigation, a pending query can be canceled.
      // This is not a real login failure and should not show a destructive toast.
      if (isCancelledLikeError(error)) {
        
        return;
      }

      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unable to sign in with Firebase.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <Utensils className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-serif tracking-tight text-primary">DN Hostel</CardTitle>
          <CardDescription>Sign in to manage your hostel meals and accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" type="email" placeholder="student@example.com" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" type="password" placeholder="••••••••" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-6" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
