import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Wallet, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

export default function Manager() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Manager Portal</h1>
        <p className="text-muted-foreground mt-1">Quick access to daily operations and record keeping.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/meals">
          <Card className="hover-elevate cursor-pointer h-full border-primary/20 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Utensils className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Meal Management</CardTitle>
              <CardDescription>Log daily meals for students, view consumption history, and update records.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/deposits">
          <Card className="hover-elevate cursor-pointer h-full border-secondary/30 hover:border-secondary/60 transition-colors">
            <CardHeader>
              <div className="bg-secondary/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle>Deposits</CardTitle>
              <CardDescription>Record student payments, track advances, and manage financial inflows.</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/bazar">
          <Card className="hover-elevate cursor-pointer h-full border-destructive/20 hover:border-destructive/50 transition-colors">
            <CardHeader>
              <div className="bg-destructive/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Bazar Lists</CardTitle>
              <CardDescription>Create market shopping lists, add items, and allocate costs across students.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
