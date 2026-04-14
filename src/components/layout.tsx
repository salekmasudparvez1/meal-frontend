import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Utensils, Wallet, ShoppingBag, FileText, Menu, Settings, ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Role } from "@/lib/api-client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isSuperAdmin, isMealManager, isUser } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, show: true },
    { name: "Manager Portal", href: "/manager", icon: Settings, show: isSuperAdmin || isMealManager },
    { name: "Students", href: "/students", icon: Users, show: isSuperAdmin || isMealManager },
    { name: "Meals", href: "/meals", icon: Utensils, show: isSuperAdmin || isMealManager },
    { name: "Deposits", href: "/deposits", icon: Wallet, show: isSuperAdmin || isMealManager },
    { name: "Bazar", href: "/bazar", icon: ShoppingBag, show: isSuperAdmin || isMealManager },
    { name: "Reports", href: "/reports", icon: FileText, show: isSuperAdmin || isMealManager },
    { name: "User Management", href: "/admin/users", icon: ShieldAlert, show: isSuperAdmin },
  ].filter(item => item.show);

  const NavLinks = ({ className, onClick }: { className?: string, onClick?: () => void }) => (
    <nav className={cn("space-y-1", className)}>
      {navigation.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.name} href={item.href} onClick={onClick}>
            <span
              className={cn(
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors"
              )}
            >
              <item.icon
                className={cn(
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground",
                  "shrink-0 -ml-1 mr-3 h-5 w-5 transition-colors"
                )}
                aria-hidden="true"
              />
              <span className="truncate">{item.name}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-16 shrink-0 items-center px-6 border-b">
              <Utensils className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-serif font-bold text-primary">DN Hostel</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <NavLinks onClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-card">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-border/50">
          <Utensils className="h-6 w-6 text-primary mr-2" />
          <span className="text-xl font-serif font-bold tracking-tight text-primary">DN Hostel</span>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 px-4 py-6">
            <NavLinks />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="-m-2.5 p-2.5 text-muted-foreground lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-4 h-9 border border-border/50 bg-card rounded-full hover:bg-muted/50">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-medium leading-none">{user.username}</span>
                        <span className="text-[10px] text-muted-foreground leading-none mt-1">{user.role}</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
