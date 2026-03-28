import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Timer, LineChart, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                Replit Agent Powered
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-[1.1] mb-6">
                Master IELTS Writing with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">AI Intelligence</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                Experience simulated exam conditions, receive instant AI-powered grading, and track your progress to hit your target band score with Ben Academy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto gap-2 text-base h-14 px-8">
                    Start Free Trial <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base">
                    Log In
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:ml-auto w-full max-w-lg"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl rounded-full z-0"></div>
              {/* hero academic luxury study setting */}
              <img 
                src={`${import.meta.env.BASE_URL}images/hero-academic.png`}
                alt="Elegant academic desk" 
                className="relative z-10 w-full h-auto rounded-3xl border border-white/10 shadow-2xl shadow-black/50 object-cover aspect-[4/3]"
              />
              
              {/* Floating UI Elements */}
              <div className="absolute -bottom-6 -left-6 z-20 glass-panel rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                <div className="bg-success/20 p-3 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Band Score</p>
                  <p className="text-2xl font-bold text-success">7.5 / 9.0</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card/30 border-y border-white/5 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-serif font-bold text-white mb-4">Precision Engineered for Success</h2>
              <p className="text-muted-foreground">Every feature is designed to replicate the real exam environment while providing superhuman feedback.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Timer, title: "Exam Simulation", desc: "Strict countdown timers, anti-cheat tab detection, and auto-save keep you focused and honest." },
                { icon: BrainCircuit, title: "AI Grading", desc: "OpenAI-powered evaluation across the 4 official IELTS criteria with actionable improvement steps." },
                { icon: LineChart, title: "Progress Analytics", desc: "Track your band scores over time, identify persistent weaknesses, and visualize your growth." }
              ].map((feature, i) => (
                <div key={i} className="glass-panel p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
