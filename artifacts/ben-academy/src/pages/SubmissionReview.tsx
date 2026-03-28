import { useRoute, Link } from "wouter";
import { useGetSubmission } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, AlignLeft, BookA, CheckCheck } from "lucide-react";
import { format } from "date-fns";

export default function SubmissionReview() {
  const [match, params] = useRoute("/submissions/:id");
  const submissionId = Number(params?.id);
  
  const { data: submission, isLoading } = useGetSubmission(submissionId, {
    request: { headers: getAuthHeaders() },
    query: { enabled: !!submissionId }
  });

  if (isLoading || !submission) return (
    <div className="min-h-screen bg-background flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center">Loading...</div></div>
  );

  let feedback = null;
  let tasks = [];
  try {
    if (submission.aiFeedback) {
      const parsed = JSON.parse(submission.aiFeedback);
      feedback = parsed.detailedFeedback;
      tasks = parsed.suggestedTasks || [];
    }
  } catch (e) {}

  const getScoreColor = (score: number) => {
    if (score >= 7.0) return "text-success border-success bg-success/10";
    if (score >= 6.0) return "text-primary border-primary bg-primary/10";
    return "text-red-400 border-red-400 bg-red-400/10";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="lg:w-2/3 space-y-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-white mb-3">{submission.test?.title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant={submission.status === 'Submitted' ? 'success' : 'warning'}>{submission.status}</Badge>
                <span>Submitted on {format(new Date(submission.createdAt), 'MMMM d, yyyy h:mm a')}</span>
              </div>
            </div>

            <Card>
              <CardHeader className="border-b border-white/5 bg-card/50">
                <CardTitle className="text-lg">Your Essay</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-invert max-w-none text-white/90 leading-relaxed whitespace-pre-wrap font-serif text-lg">
                  {submission.answers || "No answer provided."}
                </div>
              </CardContent>
            </Card>

            {feedback && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="bg-card/40 border-white/5">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3 text-primary">
                      <Target className="w-5 h-5" />
                      <h3 className="font-semibold text-white">Task Achievement</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feedback.taskAchievement}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-white/5">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3 text-blue-400">
                      <AlignLeft className="w-5 h-5" />
                      <h3 className="font-semibold text-white">Coherence & Cohesion</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feedback.coherenceCohesion}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-white/5">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3 text-green-400">
                      <BookA className="w-5 h-5" />
                      <h3 className="font-semibold text-white">Lexical Resource</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feedback.lexicalResource}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-white/5">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3 text-purple-400">
                      <CheckCheck className="w-5 h-5" />
                      <h3 className="font-semibold text-white">Grammatical Range</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feedback.grammaticalRange}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3 space-y-6">
            <Card className="overflow-hidden border-0 bg-transparent relative">
              <div className={`absolute inset-0 border-2 rounded-2xl opacity-50 pointer-events-none ${submission.score ? getScoreColor(submission.score).split(' ')[1] : 'border-white/10'}`}></div>
              <div className={`p-8 text-center rounded-2xl ${submission.score ? getScoreColor(submission.score) : 'bg-card text-white'}`}>
                <p className="text-sm font-bold uppercase tracking-widest mb-2 opacity-80">Overall Band Score</p>
                <p className="text-7xl font-serif font-bold tracking-tighter">
                  {submission.score ? submission.score.toFixed(1) : "-.-"}
                </p>
              </div>
            </Card>

            {submission.flaggedForReview && (
              <Card className="border-red-500/30 bg-red-950/20">
                <CardContent className="p-4">
                  <h3 className="text-red-400 font-semibold mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                    Flagged by AI
                  </h3>
                  <p className="text-sm text-red-200/70">This submission was flagged for potential plagiarism or inappropriate content. Please review your writing.</p>
                </CardContent>
              </Card>
            )}

            {tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suggested Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {tasks.map((task: any, idx: number) => (
                      <li key={idx} className="relative pl-6">
                        <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary/50 border border-primary"></span>
                        <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{task.description}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {submission.aiFeedback && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Overall Summary</h3>
                  <p className="text-sm text-white/90 leading-relaxed">
                    {(() => {
                      try { return JSON.parse(submission.aiFeedback).overallSummary || "Review complete." }
                      catch { return "Review complete." }
                    })()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
