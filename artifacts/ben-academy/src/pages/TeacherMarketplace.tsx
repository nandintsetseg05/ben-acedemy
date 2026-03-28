import { useState } from "react";
import { Link } from "wouter";
import { Star, Clock, GraduationCap, ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { useListTeachers } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";

export default function TeacherMarketplace() {
  const [minScore, setMinScore] = useState<string>("");
  const [maxRate, setMaxRate] = useState<string>("");
  
  const { data: teachers, isLoading } = useListTeachers(
    { 
      minScore: minScore ? parseFloat(minScore) : undefined,
      maxRate: maxRate ? parseFloat(maxRate) : undefined 
    },
    { request: { headers: getAuthHeaders() } }
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/teacher-hero.png`} 
            alt="Library" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/5 backdrop-blur-md">
              <Star className="w-3 h-3 mr-2 fill-primary" />
              IELTS Expert Tutors
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-6">
              Master IELTS with <span className="bg-gradient-to-r from-primary to-amber-200 bg-clip-text text-transparent">Personalized</span> 1:1 Coaching
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Connect with top-scoring educators for targeted feedback, speaking practice, and intensive writing review. Your first 3 sessions are free!
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 p-4 rounded-2xl bg-card border border-white/5 shadow-xl">
          <div className="flex items-center gap-3 px-2 text-muted-foreground">
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium text-white">Filters</span>
          </div>
          <div className="w-px h-8 bg-border hidden md:block" />
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
              </div>
              <Input 
                type="number" 
                placeholder="Min IELTS Score (e.g. 7.5)" 
                className="pl-10 bg-background/50 border-white/10 focus-visible:ring-primary/50"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                min="0" max="9" step="0.5"
              />
            </div>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground font-medium">
                $
              </div>
              <Input 
                type="number" 
                placeholder="Max Hourly Rate" 
                className="pl-8 bg-background/50 border-white/10 focus-visible:ring-primary/50"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="bg-card/40 border-white/5 overflow-hidden">
                <CardContent className="p-6">
                  <Skeleton className="w-16 h-16 rounded-full mb-4 opacity-10" />
                  <Skeleton className="w-3/4 h-6 mb-2 opacity-10" />
                  <Skeleton className="w-1/2 h-4 mb-6 opacity-10" />
                  <Skeleton className="w-full h-20 opacity-10" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : teachers?.length === 0 ? (
          <div className="text-center py-24 bg-card/30 rounded-3xl border border-white/5">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No tutors found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
            <Button variant="outline" className="mt-6" onClick={() => { setMinScore(""); setMaxRate(""); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers?.map(teacher => (
              <Card key={teacher.id} className="group bg-card hover:bg-card/80 transition-all duration-300 border-white/5 hover:border-primary/20 shadow-lg hover:shadow-primary/5 flex flex-col h-full overflow-hidden">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-2xl font-serif font-bold text-primary">
                      {teacher.user?.name.charAt(0).toUpperCase()}
                    </div>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20 font-bold px-3 py-1 text-sm">
                      Band {teacher.ieltScore.toFixed(1)}
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">
                    {teacher.user?.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      {teacher.rating ? teacher.rating.toFixed(1) : "New"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {teacher.totalSessions} sessions
                    </span>
                    <span className="font-medium text-white ml-auto">
                      ${teacher.hourlyRate}/hr
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground/80 line-clamp-3 mb-6 flex-1">
                    {teacher.bio || "No bio provided."}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {(() => {
                      try {
                        const specs = JSON.parse(teacher.specializations || "[]");
                        return specs.slice(0, 3).map((spec: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-white/5 border-white/10 text-xs text-muted-foreground">
                            {spec}
                          </Badge>
                        ));
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                </CardContent>
                <div className="p-4 pt-0 mt-auto">
                  <Link href={`/teachers/${teacher.id}`}>
                    <Button className="w-full gap-2 shadow-lg">
                      View Profile <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
