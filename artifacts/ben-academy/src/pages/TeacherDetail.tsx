import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetTeacher, useCreateBooking } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Clock, GraduationCap, ArrowLeft, CalendarDays, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TeacherDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: teacher, isLoading } = useGetTeacher(parseInt(id!), { 
    request: { headers: getAuthHeaders() } 
  });

  const { mutate: createBooking, isPending } = useCreateBooking({
    request: { headers: getAuthHeaders() },
    mutation: {
      onSuccess: () => {
        toast({
          title: "Booking Requested!",
          description: "Your session request has been sent to the tutor.",
        });
        setLocation("/my-bookings");
      },
      onError: (err: any) => {
        toast({
          title: "Booking Failed",
          description: err.message || "Failed to request booking.",
          variant: "destructive",
        });
      }
    }
  });

  const [sessionTime, setSessionTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [studentMessage, setStudentMessage] = useState("");

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTime) {
      toast({ title: "Time required", description: "Please select a date and time.", variant: "destructive" });
      return;
    }
    createBooking({
      data: {
        teacherId: parseInt(id!),
        sessionTime: new Date(sessionTime).toISOString(),
        durationMinutes: parseInt(durationMinutes),
        studentMessage
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <h2 className="text-2xl font-bold">Teacher Not Found</h2>
          <Link href="/teachers">
            <Button variant="outline">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  let specializations: string[] = [];
  try { specializations = JSON.parse(teacher.specializations || "[]"); } catch {}
  
  let availableTimes: string[] = [];
  try { availableTimes = JSON.parse(teacher.availableTimes || "[]"); } catch {}

  const isFreeEligible = teacher.freeSessionsLeft && teacher.freeSessionsLeft > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Link href="/teachers" className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tutors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-4xl font-serif font-bold text-primary shadow-xl shadow-primary/5 shrink-0">
                {teacher.user?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white font-serif">{teacher.user?.name}</h1>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20 font-bold text-sm">
                    Band {teacher.ieltScore.toFixed(1)}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    {teacher.rating ? teacher.rating.toFixed(1) : "No ratings yet"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    {teacher.totalSessions} Sessions Completed
                  </span>
                </div>
              </div>
            </div>

            <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
              <CardContent className="p-8 prose prose-invert max-w-none">
                <h3 className="text-xl font-serif text-white mb-4">About Me</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {teacher.bio || "No biography provided."}
                </p>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Areas of Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {specializations.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {specializations.map((spec, i) => (
                        <Badge key={i} variant="outline" className="bg-background border-white/10 text-muted-foreground">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    Usual Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableTimes.length > 0 ? (
                    <ul className="space-y-2">
                      {availableTimes.map((time, i) => (
                        <li key={i} className="flex items-center text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-primary/70" />
                          {time}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Flexible. Send a request to confirm.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <Card className="border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden relative">
                {isFreeEligible && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-success to-emerald-400" />
                )}
                <CardHeader className="bg-white/5 border-b border-white/5 pb-6">
                  <div className="flex justify-between items-end mb-2">
                    <CardTitle className="text-2xl font-serif">Book a Session</CardTitle>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">${teacher.hourlyRate}</span>
                      <span className="text-muted-foreground text-sm">/hr</span>
                    </div>
                  </div>
                  {isFreeEligible && (
                    <Badge className="bg-success/20 text-success hover:bg-success/30 border-success/30 w-fit">
                      {teacher.freeSessionsLeft} Free Sessions Remaining
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleBook} className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-white/80">Select Date & Time</Label>
                      <Input 
                        type="datetime-local" 
                        required
                        className="bg-background/50 border-white/10 [color-scheme:dark]"
                        value={sessionTime}
                        onChange={(e) => setSessionTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white/80">Duration</Label>
                      <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                        <SelectTrigger className="bg-background/50 border-white/10">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white/80">Message for Tutor (Optional)</Label>
                      <Textarea 
                        placeholder="What would you like to focus on?" 
                        className="bg-background/50 border-white/10 resize-none h-24"
                        value={studentMessage}
                        onChange={(e) => setStudentMessage(e.target.value)}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Requesting...</>
                      ) : isFreeEligible ? (
                        "Request Free Session"
                      ) : (
                        "Request Session"
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      You won't be charged until the tutor confirms.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
