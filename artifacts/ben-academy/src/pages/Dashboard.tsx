import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetDashboard } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PenTool, Target, Trophy, Crown, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { data, isLoading, error } = useGetDashboard({
    request: { headers: getAuthHeaders() },
    query: {
      retry: false,
    }
  });

  useEffect(() => {
    if (error) setLocation("/login");
  }, [error, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Welcome back, {data.user.name.split(' ')[0]}</h1>
            <p className="text-muted-foreground">Here is your academic progress overview.</p>
          </div>
          <div className="flex gap-3">
            {!data.user.isPaid && (
              <Link href="/upgrade">
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 gap-2">
                  <Crown className="w-4 h-4" /> Upgrade to Pro
                </Button>
              </Link>
            )}
            <Link href="/tests">
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <PenTool className="w-4 h-4" /> Take a Test
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <PenTool className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <p className="text-3xl font-bold text-white">{data.totalTests}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold text-white">{data.averageScore?.toFixed(1) || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <Target className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Target Score</p>
                <p className="text-3xl font-bold text-white">{data.user.targetBand?.toFixed(1) || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Progress Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {data.progressData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.progressData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#666" 
                          tick={{ fill: '#888', fontSize: 12 }} 
                          tickFormatter={(str) => format(new Date(str), 'MMM d')}
                        />
                        <YAxis domain={[0, 9]} stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#191D26', border: '1px solid #333', borderRadius: '8px' }}
                          itemStyle={{ color: '#E5B94C' }}
                          labelFormatter={(str) => format(new Date(str), 'MMM d, yyyy')}
                        />
                        <Line type="monotone" dataKey="score" stroke="#E5B94C" strokeWidth={3} dot={{ r: 4, fill: '#E5B94C', strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center flex-col text-muted-foreground">
                      <LineChart className="w-12 h-12 mb-4 opacity-20" />
                      <p>Complete tests to see your progress chart.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.submissions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No tests taken yet.</p>
                  ) : (
                    data.submissions.map((sub) => (
                      <motion.div 
                        key={sub.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-background/50 hover:bg-background/80 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-white mb-1">{sub.test?.title || `Test #${sub.testId}`}</p>
                          <p className="text-sm text-muted-foreground">{format(new Date(sub.createdAt), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {sub.status === 'Submitted' && sub.score && (
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Score</p>
                              <p className="font-bold text-lg text-primary">{sub.score.toFixed(1)}</p>
                            </div>
                          )}
                          <Badge variant={sub.status === 'Submitted' ? 'success' : sub.status === 'TimeExpired' ? 'destructive' : 'warning'}>
                            {sub.status}
                          </Badge>
                          <Link href={sub.status === 'InProgress' ? `/tests/${sub.testId}/room/${sub.id}` : `/submissions/${sub.id}`}>
                            <Button variant="ghost" size="icon" className="hover:bg-primary/20 hover:text-primary">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="border-red-900/30 bg-red-950/10">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.weaknesses.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No weaknesses identified yet. Keep taking tests!</p>
                ) : (
                  <ul className="space-y-3">
                    {data.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{w}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Suggested Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {data.suggestedTasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Complete a test to get personalized task recommendations.</p>
                ) : (
                  <div className="space-y-4">
                    {data.suggestedTasks.map((task, i) => (
                      <div key={i} className="bg-background/60 p-3 rounded-lg border border-primary/10">
                        <p className="font-semibold text-white text-sm mb-1">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
