import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PendingFact {
  fact: string;
  index: number;
}

export const PendingFacts = () => {
  const [facts, setFacts] = useState<PendingFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null);
  const [rejectingIndex, setRejectingIndex] = useState<number | null>(null);

  const fetchPendingFacts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/facts/pending-facts');
      // Convert array to indexed objects
      const factsWithIndex = (data || []).map((fact: string, idx: number) => ({
        fact,
        index: idx
      }));
      setFacts(factsWithIndex);
    } catch (e) {
      console.error("Failed to fetch pending facts", e);
      toast.error("Failed to load pending facts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingFacts();
  }, []);

  const handleApproveFact = async (index: number) => {
    try {
      setApprovingIndex(index);
      
      // Optimistic update: remove from pending immediately
      const factToApprove = facts[index];
      setFacts(prev => prev.filter((_, i) => i !== index));
      
      // Send to API
      await api.post('/facts/approve-fact', { factIndex: index });
      
      toast.success("✅ Fact approved and learned!");
    } catch (e) {
      console.error("Failed to approve fact", e);
      toast.error("Failed to approve fact");
      // Refetch to restore state
      fetchPendingFacts();
    } finally {
      setApprovingIndex(null);
    }
  };

  const handleRejectFact = async (index: number) => {
    try {
      setRejectingIndex(index);
      
      // Optimistic update: remove from pending immediately
      setFacts(prev => prev.filter((_, i) => i !== index));
      
      // Send to API
      await api.post('/facts/reject-fact', { factIndex: index });
      
      toast.success("❌ Fact rejected");
    } catch (e) {
      console.error("Failed to reject fact", e);
      toast.error("Failed to reject fact");
      // Refetch to restore state
      fetchPendingFacts();
    } finally {
      setRejectingIndex(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-slate-900/50 via-purple-900/20 to-slate-900/50 border-purple-500/30">
        <div className="flex items-center justify-center gap-2 text-slate-300">
          <Loader2 className="animate-spin w-4 h-4" />
          <span>Loading pending facts...</span>
        </div>
      </Card>
    );
  }

  if (facts.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-slate-900/50 via-purple-900/20 to-slate-900/50 border-purple-500/30">
        <div className="text-center text-slate-400">
          <p className="text-sm">✨ No pending facts to review</p>
          <p className="text-xs mt-1">Visitors will share facts as they chat with your avatar</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-purple-300 mb-4">
        📚 Pending Facts ({facts.length})
      </div>
      
      <AnimatePresence>
        {facts.map((item, idx) => (
          <motion.div
            key={`${item.index}-${idx}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 bg-gradient-to-r from-slate-800/40 via-slate-800/20 to-slate-800/40 border-slate-700/50 hover:border-purple-500/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {item.fact}
                  </p>
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleApproveFact(item.index)}
                    disabled={approvingIndex === item.index || rejectingIndex === item.index}
                    className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 disabled:opacity-50 transition-colors"
                    title="Approve this fact"
                  >
                    {approvingIndex === item.index ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRejectFact(item.index)}
                    disabled={approvingIndex === item.index || rejectingIndex === item.index}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-50 transition-colors"
                    title="Reject this fact"
                  >
                    {rejectingIndex === item.index ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
