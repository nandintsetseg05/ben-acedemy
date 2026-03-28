import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { getAuthHeaders } from "@/lib/utils";
import { 
  useGetMyTeacherProfile, 
  useUpsertTeacherProfile, 
  useListTeacherBookings, 
  useRespondToBooking, 
  useCompleteBooking,
  getListTeacherBookingsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, CalendarClock, User } from "lucide-react";
import { format } from "date-fns";

export default function TeacherDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"bookings" | "profile">("bookings");

  const { data: profile, isLoading: isProfileLoading, isError: noProfile } = useGetMyTeacherProfile({
    request: { headers: getAuthHeaders() },
    query: { retry: false }
  });

  const { data: bookings = [], isLoading: isBookingsLoading } = useListTeacherBookings({
    request: { headers: getAuthHeaders() },
    query: { enabled: !noProfile }
  });

  const { mutate: upsertProfile, isPending: isSaving } = useUpsertTeacherProfile({
    request: { headers: getAuthHeaders() },
    mutation: {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/teachers/me"] });
      }
    }
  });

  const { mutate: respondBooking } = useRespondToBooking({
    request: { headers: getAuthHeaders() },
    mutation: {
      onSuccess: () => {
        toast({ title: "Response sent" });
        queryClient.invalidateQueries({ queryKey: getListTeacherBookingsQueryKey() });
        setRespondModal(null);
      }
    }
  });

  const { mutate: completeBooking } = useCompleteBooking({
    request: { headers: getAuthHeaders() },
    mutation: {
      onSuccess: () => {
        toast({ title: "Session marked as completed" });
        queryClient.invalidateQueries({ queryKey: getListTeacherBookingsQueryKey() });
        setCompleteModal(null);
      }
    }
  });

  // Form states
  const [ieltScore, setIeltScore] = useState("7.5");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("30");
  const [specializations, setSpecializations] = useState("");
  const [availableTimes, setAvailableTimes] = useState("");

  useEffect(() => {
    if (profile) {
      setIeltScore(profile.ieltScore.toString());
      setBio(profile.bio);
      setHourlyRate(profile.hourlyRate.toString());
      try {
        setSpecializations(JSON.parse(profile.specializations).join(", "));
        setAvailableTimes(JSON.parse(profile.availableTimes).join(", "));
      } catch {}
    } else if (noProfile) {
      setActiveTab("profile");
    }
  }, [profile, noProfile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const specsArray = specializations.split(",").map(s => s.trim()).filter(Boolean);
    const timesArray = availableTimes.split(",").map(s => s.trim()).filter(Boolean);
    
    upsertProfile({
      data: {
        ieltScore: parseFloat(ieltScore),
        bio,
        hourlyRate: parseFloat(hourlyRate),
        specializations: JSON.stringify(specsArray),
        availableTimes: JSON.stringify(timesArray),
      }
    });
  };

  // Modals state
  const [respondModal, setRespondModal] = useState<{ id: number, action: "Confirmed" | "Declined" } | null>(null);
  const [completeModal, setCompleteModal] = useState<{ id: number } | null>(null);
  const [teacherNote, setTeacherNote] = useState("");

  const pendingBookings = bookings.filter(b => b.status === "Pending");
  const confirmedBookings = bookings.filter(b => b.status === "Confirmed");
  const pastBookings = bookings.filter(b => b.status === "Completed" || b.status === "Declined");

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "Pending": return <Badge variant="outline" className="text-yellow-400 border-yellow-400/50 bg-yellow-400/10">Pending</Badge>;
      case "Confirmed": return <Badge variant="outline" className="text-emerald-400 border-emerald-400/50 bg-emerald-400/10">Confirmed</Badge>;
      case "Completed": return <Badge variant="outline" className="text-blue-400 border-blue-400/50 bg-blue-400/10">Completed</Badge>;
      case "Declined": return <Badge variant="outline" className="text-red-400 border-red-400/50 bg-red-400/10">Declined</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (isProfileLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Tutor Dashboard</h1>
            <p className="text-muted-foreground">Manage your profile and 1:1 sessions.</p>
          </div>
          
          <div className="flex bg-card/50 border border-white/5 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("bookings")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "bookings" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
            >
              My Sessions
            </button>
            <button 
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "profile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
            >
              Public Profile
            </button>
          </div>
        </div>

        {activeTab === "profile" && (
          <Card className="bg-card/50 border-white/5 max-w-3xl">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>This information will be visible to students in the marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>IELTS Band Score</Label>
                    <Input 
                      type="number" step="0.5" min="0" max="9"
                      value={ieltScore} onChange={(e) => setIeltScore(e.target.value)}
                      required
                      className="bg-background/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Hourly Rate ($)</Label>
                    <Input 
                      type="number" min="0"
                      value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)}
                      required
                      className="bg-background/50 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>About Me</Label>
                  <Textarea 
                    rows={4}
                    value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell students about your teaching style and experience..."
                    className="bg-background/50 border-white/10 resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Specializations (comma separated)</Label>
                  <Input 
                    value={specializations} onChange={(e) => setSpecializations(e.target.value)}
                    placeholder="e.g. Speaking, Task 2 Essay, Academic Reading"
                    className="bg-background/50 border-white/10"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Usual Availability (comma separated)</Label>
                  <Input 
                    value={availableTimes} onChange={(e) => setAvailableTimes(e.target.value)}
                    placeholder="e.g. Weekdays after 5pm EST, Weekends"
                    className="bg-background/50 border-white/10"
                  />
                </div>

                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-8">
            {noProfile ? (
              <div className="p-8 text-center bg-card/30 border border-white/5 rounded-2xl">
                <p className="text-muted-foreground">Please set up your profile first to receive bookings.</p>
                <Button onClick={() => setActiveTab("profile")} className="mt-4" variant="outline">Setup Profile</Button>
              </div>
            ) : (
              <>
                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-card/40 border-white/5">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Sessions</p>
                      <p className="text-3xl font-bold text-white">{profile?.totalSessions}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40 border-white/5">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Pending Requests</p>
                      <p className="text-3xl font-bold text-yellow-400">{pendingBookings.length}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming/Pending */}
                <div>
                  <h3 className="text-xl font-serif text-white mb-4 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-primary" /> Active Requests & Upcoming
                  </h3>
                  <div className="grid gap-4">
                    {[...pendingBookings, ...confirmedBookings].length === 0 ? (
                      <p className="text-muted-foreground p-8 text-center border border-white/5 border-dashed rounded-xl">No active or upcoming bookings.</p>
                    ) : (
                      [...pendingBookings, ...confirmedBookings].map(booking => (
                        <Card key={booking.id} className="bg-card/60 border-white/5 hover:border-white/10 transition-colors">
                          <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between md:items-center">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <StatusBadge status={booking.status} />
                                <span className="font-medium text-white flex items-center gap-1">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  {booking.studentName || "Student"}
                                </span>
                              </div>
                              <p className="text-lg font-semibold text-primary">
                                {format(new Date(booking.sessionTime), "EEEE, MMMM do 'at' h:mm a")} 
                                <span className="text-muted-foreground text-sm font-normal ml-2">({booking.durationMinutes} min)</span>
                              </p>
                              {booking.studentMessage && (
                                <p className="text-sm text-muted-foreground bg-black/20 p-3 rounded-lg border border-white/5 mt-2">
                                  "{booking.studentMessage}"
                                </p>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-3 shrink-0">
                              {booking.status === "Pending" && (
                                <>
                                  <Button 
                                    onClick={() => { setTeacherNote(""); setRespondModal({ id: booking.id, action: "Confirmed" }); }}
                                    className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 border-none"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" /> Accept
                                  </Button>
                                  <Button 
                                    onClick={() => { setTeacherNote(""); setRespondModal({ id: booking.id, action: "Declined" }); }}
                                    variant="outline"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" /> Decline
                                  </Button>
                                </>
                              )}
                              {booking.status === "Confirmed" && (
                                <Button 
                                  onClick={() => { setTeacherNote(""); setCompleteModal({ id: booking.id }); }}
                                  className="w-full md:w-auto"
                                >
                                  Mark as Completed
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Past */}
                {pastBookings.length > 0 && (
                  <div className="opacity-70 mt-12">
                    <h3 className="text-lg font-serif text-white mb-4">Past & Declined</h3>
                    <div className="grid gap-3">
                      {pastBookings.map(booking => (
                        <div key={booking.id} className="flex justify-between items-center p-4 bg-card/30 border border-white/5 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-white mb-1">{booking.studentName || "Student"}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(booking.sessionTime), "MMM d, yyyy")}</p>
                          </div>
                          <StatusBadge status={booking.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <Dialog open={!!respondModal} onOpenChange={(o) => !o && setRespondModal(null)}>
        <DialogContent className="bg-card border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{respondModal?.action === "Confirmed" ? "Accept Session" : "Decline Session"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Note to student (Optional)</Label>
              <Textarea 
                placeholder={respondModal?.action === "Confirmed" ? "Looking forward to our session! Here's a link to the meeting..." : "Sorry, I am unavailable at this time."}
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                className="bg-background/50 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRespondModal(null)}>Cancel</Button>
            <Button 
              variant={respondModal?.action === "Confirmed" ? "default" : "destructive"}
              onClick={() => respondModal && respondBooking({ id: respondModal.id, data: { status: respondModal.action, teacherNote }})}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!completeModal} onOpenChange={(o) => !o && setCompleteModal(null)}>
        <DialogContent className="bg-card border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Session</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Marking this session as completed will update your total sessions count.</p>
            <div className="space-y-2">
              <Label>Feedback for student (Optional)</Label>
              <Textarea 
                placeholder="Great job today! Next time we will focus on..."
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                className="bg-background/50 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCompleteModal(null)}>Cancel</Button>
            <Button 
              onClick={() => completeModal && completeBooking({ id: completeModal.id, data: { teacherNote }})}
            >
              Mark Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
