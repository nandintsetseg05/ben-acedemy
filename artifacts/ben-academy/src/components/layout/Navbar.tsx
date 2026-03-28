import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, LayoutDashboard, Crown, Users, CalendarDays, Presentation } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";
import { NotificationPanel } from "./NotificationPanel";

export function Navbar() {
  const { isAuthenticated, clearToken } = useAuthStore();
  const [_, setLocation] = useLocation();

  const { data: user } = useGetMe({
    request: { headers: getAuthHeaders() },
    query: { enabled: isAuthenticated, retry: false }
  });

  const handleLogout = () => {
    clearToken();
    setLocation("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <span className="font-serif text-2xl font-bold text-white tracking-tight hidden sm:block">
              Ben Academy
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white px-2 sm:px-4">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden lg:inline">Dashboard</span>
                  </Button>
                </Link>
                <Link href="/tests">
                  <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white px-2 sm:px-4">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden lg:inline">Tests</span>
                  </Button>
                </Link>
                <Link href="/teachers">
                  <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white px-2 sm:px-4">
                    <Users className="w-4 h-4" />
                    <span className="hidden lg:inline">Tutors</span>
                  </Button>
                </Link>
                <Link href="/my-bookings">
                  <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white px-2 sm:px-4">
                    <CalendarDays className="w-4 h-4" />
                    <span className="hidden lg:inline">Bookings</span>
                  </Button>
                </Link>
                
                {user?.role === "teacher" && (
                  <Link href="/teacher-dashboard">
                    <Button variant="ghost" className="gap-2 text-primary hover:text-primary/80 hover:bg-primary/10 px-2 sm:px-4">
                      <Presentation className="w-4 h-4" />
                      <span className="hidden lg:inline">Teach</span>
                    </Button>
                  </Link>
                )}

                {!user?.isPaid && (
                  <Link href="/upgrade">
                    <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                      <Crown className="w-4 h-4" />
                      <span className="hidden md:inline">Pro</span>
                    </Button>
                  </Link>
                )}
                
                <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
                
                <NotificationPanel />
                
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/teachers">
                  <Button variant="ghost" className="text-muted-foreground hover:text-white">
                    Find Tutors
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" className="text-muted-foreground hover:text-white">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="shadow-primary/20 shadow-lg">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
