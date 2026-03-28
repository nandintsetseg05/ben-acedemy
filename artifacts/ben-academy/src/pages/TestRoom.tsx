import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetSubmission, useAutosaveSubmission, useSubmitSubmission } from "@workspace/api-client-react";
import { getAuthHeaders, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Clock, Save, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function TestRoom() {
  const [match, params] = useRoute("/tests/:testId/room/:submissionId");
  const testId = Number(params?.testId);
  const submissionId = Number(params?.submissionId);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [violations, setViolations] = useState(0);

  const { data: submission, isLoading } = useGetSubmission(submissionId, {
    request: { headers: getAuthHeaders() },
    query: {
      enabled: !!submissionId,
      refetchOnWindowFocus: false,
    }
  });

  const autosaveMutation = useAutosaveSubmission({
    request: { headers: getAuthHeaders() },
  });

  const submitMutation = useSubmitSubmission({
    request: { headers: getAuthHeaders() },
    mutation: {
      onSuccess: () => {
        toast({ title: "Test Submitted", description: "Your essay is being graded." });
        setLocation(`/submissions/${submissionId}/grading`);
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Submission Failed", description: err.message });
      }
    }
  });

  // Initialize text and timer
  useEffect(() => {
    if (submission && submission.test) {
      if (submission.status !== 'InProgress') {
        toast({ title: "Test Closed", description: "This test is already completed." });
        setLocation(`/submissions/${submissionId}`);
        return;
      }

      if (text === "" && submission.answers) {
        setText(submission.answers);
      }

      // Calculate time remaining based on createdAt if we want server-side truth,
      // but for simplicity we'll just use a local timer derived from the duration.
      // A more robust approach uses the server createdAt + durationMinutes
      const createdAt = new Date(submission.createdAt).getTime();
      const now = Date.now();
      const durationMs = submission.test.durationMinutes * 60 * 1000;
      const elapsed = now - createdAt;
      const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
      
      setTimeLeft(remaining);
    }
  }, [submission]);

  // Timer interval
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitMutation.isPending) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return (prev ?? 0) - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, submitMutation.isPending]);

  // Auto-save every 30 seconds
  const textRef = useRef(text);
  useEffect(() => { textRef.current = text; }, [text]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      autosaveMutation.mutate({ 
        id: submissionId, 
        data: { answers: textRef.current } 
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [timeLeft, submissionId]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && timeLeft !== null && timeLeft > 0) {
        setViolations(v => v + 1);
        toast({ 
          variant: "destructive", 
          title: "Warning: Tab Switch Detected", 
          description: "Leaving the exam tab is recorded. Repeated violations may invalidate your score." 
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [timeLeft]);

  const handleAutoSubmit = () => {
    toast({ variant: "destructive", title: "Time's up!", description: "Auto-submitting your test." });
    submitMutation.mutate({ id: submissionId, data: { answers: textRef.current, expired: true } });
  };

  const handleManualSubmit = () => {
    if (confirm("Are you sure you want to submit your test? This action cannot be undone.")) {
      submitMutation.mutate({ id: submissionId, data: { answers: text } });
    }
  };

  if (isLoading || !submission) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-white">Loading exam environment...</div>;
  }

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Exam Header */}
      <header className="h-16 border-b border-white/10 bg-card/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="font-serif font-bold text-primary">BA</span>
          </div>
          <div>
            <h1 className="font-semibold text-white leading-tight">{submission.test?.title}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={violations > 0 ? "text-destructive" : "text-success"}>
                {violations} Violations
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {autosaveMutation.isPending ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
              <Save className="w-3 h-3" /> Saving...
            </span>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Save className="w-3 h-3" /> Saved locally
            </span>
          )}

          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-lg font-bold border ${timeLeft !== null && timeLeft < 300 ? 'bg-destructive/20 text-red-400 border-red-500/50 animate-pulse' : 'bg-background border-white/10 text-white'}`}>
            <Clock className="w-4 h-4" />
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>

          <Button 
            onClick={handleManualSubmit} 
            disabled={submitMutation.isPending || timeLeft === null || timeLeft <= 0}
            className="gap-2 shadow-primary/20 shadow-lg"
          >
            <Send className="w-4 h-4" />
            {submitMutation.isPending ? "Submitting..." : "Submit Test"}
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Prompt Pane */}
        <div className="lg:w-[45%] border-r border-white/10 bg-background/50 overflow-y-auto p-8 custom-scrollbar">
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/5">Writing Task</Badge>
          <div className="prose prose-invert max-w-none">
            <div className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap font-serif">
              {submission.test?.prompt}
            </div>
          </div>
          
          <Card className="mt-12 bg-blue-900/10 border-blue-500/20">
            <CardContent className="p-4 flex gap-3 text-sm text-blue-200">
              <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0" />
              <p>Write at least 250 words. Do not navigate away from this tab or you will receive a violation warning.</p>
            </CardContent>
          </Card>
        </div>

        {/* Editor Pane */}
        <div className="lg:w-[55%] flex flex-col bg-card/20 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={timeLeft === null || timeLeft <= 0 || submitMutation.isPending}
            placeholder="Begin writing your essay here..."
            className="flex-1 w-full bg-transparent resize-none p-8 text-lg text-white leading-relaxed focus:outline-none placeholder:text-muted-foreground/50 custom-scrollbar disabled:opacity-50"
            spellCheck={false}
          />
          <div className="absolute bottom-4 right-6 pointer-events-none">
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border ${wordCount < 250 ? 'bg-background/80 border-border text-muted-foreground' : 'bg-success/20 border-success/30 text-success'}`}>
              {wordCount} words
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
