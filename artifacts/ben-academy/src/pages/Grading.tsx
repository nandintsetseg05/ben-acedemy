import { useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetSubmission, useGradeSubmission } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Grading() {
  const [match, params] = useRoute("/submissions/:id/grading");
  const submissionId = Number(params?.id);
  const [_, setLocation] = useLocation();
  const gradedRef = useRef(false);

  const { data: submission } = useGetSubmission(submissionId, {
    request: { headers: getAuthHeaders() },
    query: { enabled: !!submissionId }
  });

  const gradeMutation = useGradeSubmission({
    request: { headers: getAuthHeaders() }
  });

  useEffect(() => {
    if (submission && submission.answers && !gradedRef.current) {
      gradedRef.current = true; // prevent double trigger
      
      gradeMutation.mutateAsync({
        data: {
          submissionId,
          essayText: submission.answers,
        }
      }).then(() => {
        // Allow time for the cool animation
        setTimeout(() => {
          setLocation(`/submissions/${submissionId}`);
        }, 1500);
      }).catch(err => {
        console.error("Grading failed", err);
        setLocation(`/submissions/${submissionId}`);
      });
    }
  }, [submission]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/ai-grading.png`}
          alt="AI Grading Background"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="z-10 text-center max-w-md w-full glass-panel p-12 rounded-3xl"
      >
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <div className="absolute inset-4 rounded-full border-b-2 border-amber-200 animate-spin" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center font-serif font-bold text-xl text-primary">BA</div>
        </div>
        
        <h2 className="text-2xl font-serif font-bold text-white mb-3">AI is analyzing your essay</h2>
        <p className="text-muted-foreground mb-8">Evaluating Task Achievement, Coherence, Lexical Resource, and Grammatical Range...</p>

        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary via-amber-200 to-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 15, ease: "linear" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
