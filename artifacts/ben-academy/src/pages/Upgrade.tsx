import { useCreateCheckout, useGetSubscriptionStatus, useCreatePortal } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown, Loader2 } from "lucide-react";

export default function Upgrade() {
  const { data: status, isLoading } = useGetSubscriptionStatus({
    request: { headers: getAuthHeaders() }
  });

  const checkoutMutation = useCreateCheckout({
    request: { headers: getAuthHeaders() },
    mutation: {
      onSuccess: (data) => {
        window.location.href = data.url;
      }
    }
  });

  const portalMutation = useCreatePortal({
    request: { headers: getAuthHeaders() },
    mutation: {
      onSuccess: (data) => {
        window.location.href = data.url;
      }
    }
  });

  const handleCheckout = () => checkoutMutation.mutate({});
  const handlePortal = () => portalMutation.mutate({});

  if (isLoading) return <div className="min-h-screen bg-background"><Navbar /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-16 text-center">
        {status?.isPaid ? (
          <div className="glass-panel p-12 rounded-3xl max-w-lg mx-auto border-primary/30">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-4">You are Pro</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for subscribing! You have unlimited access to all writing tests and priority AI grading.
            </p>
            <Button onClick={handlePortal} variant="outline" className="w-full" disabled={portalMutation.isPending}>
              {portalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Manage Subscription
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">Unlock Your Full Potential</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              Upgrade to Ben Academy Pro to access all premium writing tests, unlimited AI grading, and deeper analytics.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
              {/* Free Tier */}
              <div className="p-8 rounded-3xl border border-white/10 bg-card/30 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
                <p className="text-3xl font-bold text-white mb-6">$0 <span className="text-base font-normal text-muted-foreground">/ forever</span></p>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Access to 2 basic tests', 'Standard AI feedback', 'Basic progress tracking'].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-white/30 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button variant="secondary" className="w-full" disabled>Current Plan</Button>
              </div>

              {/* Pro Tier */}
              <div className="p-8 rounded-3xl border border-primary/50 bg-primary/5 relative flex flex-col shadow-2xl shadow-primary/10">
                <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Recommended
                </div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" /> Pro Plan
                </h3>
                <p className="text-3xl font-bold text-white mb-6">$19 <span className="text-base font-normal text-muted-foreground">/ month</span></p>
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    'Unlimited access to all tests', 
                    'Advanced 4-criteria AI grading', 
                    'Detailed task suggestions', 
                    'Priority grading queue'
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/90">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={handleCheckout} 
                  className="w-full shadow-lg shadow-primary/20"
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
