import { Link } from "wouter";
import { useListTests, useGetMe, useCreateSubmission } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Clock, FileText, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function TestList() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: tests, isLoading } = useListTests({
    request: { headers: getAuthHeaders() }
  });

  const { data: user } = useGetMe({
    request: { headers: getAuthHeaders() }
  });

  const createSubmission = useCreateSubmission({
    request: { headers: getAuthHeaders() },
    mutation: {
      onSuccess: (data) => {
        setLocation(`/tests/${data.testId}/room/${data.id}`);
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "Failed to start test" });
        if (err.message?.includes("subscription") || err.message?.includes("Paid")) {
          setLocation("/upgrade");
        }
      }
    }
  });

  const handleStartTest = (testId: number) => {
    createSubmission.mutate({ data: { testId } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-bold text-white mb-4">Available Tests</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Choose a writing test below. Ensure you have {`40`} minutes of uninterrupted time before starting an exam.
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="animate-pulse h-[280px] bg-card/20" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests?.map((test) => {
              const isLocked = test.isPaid && !user?.isPaid;
              
              return (
                <Card key={test.id} className={`flex flex-col transition-all duration-300 ${isLocked ? 'opacity-80' : 'hover:-translate-y-1 hover:shadow-primary/10 hover:border-primary/30'}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                        {test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
                      </Badge>
                      {test.isPaid && (
                        <Badge variant={isLocked ? "destructive" : "default"} className="gap-1">
                          {isLocked ? <Lock className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                          Pro
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl leading-tight">{test.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">{test.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        {test.durationMinutes} mins
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-400" />
                        Essay Task
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-white/5">
                    {isLocked ? (
                      <Link href="/upgrade" className="w-full">
                        <Button variant="secondary" className="w-full gap-2 group">
                          <Lock className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" /> 
                          Unlock Access
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        onClick={() => handleStartTest(test.id)} 
                        className="w-full gap-2 shadow-lg"
                        disabled={createSubmission.isPending}
                      >
                        Start Test <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// Ensure Crown icon is imported
import { Crown } from "lucide-react";
