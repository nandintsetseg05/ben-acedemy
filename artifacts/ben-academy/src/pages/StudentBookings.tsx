import { Navbar } from "@/components/layout/Navbar";
import { getAuthHeaders } from "@/lib/utils";
import { useListStudentBookings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays, ExternalLink, MessageSquareText } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function StudentBookings() {
  const { data: bookings, isLoading } = useListStudentBookings({
    request: { headers: getAuthHeaders() }
  });

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "Pending": return <Badge variant="outline" className="text-yellow-400 border-yellow-400/50 bg-yellow-400/10">Pending</Badge>;
      case "Confirmed": return <Badge variant="outline" className="text-emerald-400 border-emerald-400/50 bg-emerald-400/10">Confirmed</Badge>;
      case "Completed": return <Badge variant="outline" className="text-blue-400 border-blue-400/50 bg-blue-400/10">Completed</Badge>;
      case "Declined": return <Badge variant="outline" className="text-red-400 border-red-400/50 bg-red-400/10">Declined</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const PaymentBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "Free": return <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20">Free Trial</Badge>;
      case "Paid": return <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Paid</Badge>;
      case "Required": return <Badge variant="destructive" className="bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20">Subscription Required</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-white mb-2">My Bookings</h1>
          <p className="text-muted-foreground">Manage your 1:1 tutoring sessions.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : bookings?.length === 0 ? (
          <div className="text-center py-24 bg-card/30 rounded-3xl border border-white/5">
            <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-6">Find an expert tutor and schedule your first session.</p>
            <Link href="/teachers">
              <Button>Browse Tutors</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings?.map(booking => (
              <Card key={booking.id} className="bg-card/60 border-white/5 hover:border-white/10 transition-colors overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="bg-black/20 p-6 sm:w-64 border-b sm:border-b-0 sm:border-r border-white/5 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-serif text-primary border border-primary/20 shrink-0">
                        {booking.teacher?.user?.name?.charAt(0) || "T"}
                      </div>
                      <div>
                        <p className="font-semibold text-white leading-tight">{booking.teacher?.user?.name || "Unknown Tutor"}</p>
                        <Link href={`/teachers/${booking.teacherId}`} className="text-xs text-primary hover:underline">View Profile</Link>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <StatusBadge status={booking.status} />
                      <PaymentBadge status={booking.paymentStatus} />
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    <p className="text-xl font-semibold text-white mb-1">
                      {format(new Date(booking.sessionTime), "EEEE, MMMM do, yyyy")}
                    </p>
                    <p className="text-primary font-medium flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4" />
                      {format(new Date(booking.sessionTime), "h:mm a")} ({booking.durationMinutes} min)
                    </p>

                    {booking.paymentStatus === "Required" && booking.status !== "Declined" && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
                        <p className="text-sm text-destructive/90 font-medium">
                          You need an active subscription to attend this session.
                        </p>
                        <Link href="/upgrade">
                          <Button size="sm" variant="destructive">Upgrade Now</Button>
                        </Link>
                      </div>
                    )}

                    {booking.teacherNote && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mt-2">
                        <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <MessageSquareText className="w-3 h-3" />
                          Note from Tutor
                        </p>
                        <p className="text-sm text-white/90 italic">"{booking.teacherNote}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
