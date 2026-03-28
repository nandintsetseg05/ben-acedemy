import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useRegister } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  currentBand: z.coerce.number().min(0).max(9).optional(),
  targetBand: z.coerce.number().min(0).max(9).optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [_, setLocation] = useLocation();
  const { setToken } = useAuthStore();
  const { toast } = useToast();
  
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "Account created!", description: "Welcome to Ben Academy." });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ 
          variant: "destructive", 
          title: "Registration Failed", 
          description: error?.message || "An error occurred during registration." 
        });
      }
    }
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate({ data });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="flex justify-center mb-8">
          <Link href="/">
            <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 cursor-pointer">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </Link>
        </div>

        <Card className="border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl">Create Account</CardTitle>
            <CardDescription>Start your journey to IELTS mastery</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Full Name</label>
                <Input {...formRegister("name")} placeholder="John Doe" className={errors.name ? "border-destructive" : ""} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Email</label>
                <Input {...formRegister("email")} type="email" placeholder="name@example.com" className={errors.email ? "border-destructive" : ""} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Password</label>
                <Input {...formRegister("password")} type="password" placeholder="••••••••" className={errors.password ? "border-destructive" : ""} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Current Band (Optional)</label>
                  <Input {...formRegister("currentBand")} type="number" step="0.5" placeholder="6.0" />
                  {errors.currentBand && <p className="text-xs text-destructive">{errors.currentBand.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Target Band (Optional)</label>
                  <Input {...formRegister("targetBand")} type="number" step="0.5" placeholder="7.5" />
                  {errors.targetBand && <p className="text-xs text-destructive">{errors.targetBand.message}</p>}
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base mt-4" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-white/5 pt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
