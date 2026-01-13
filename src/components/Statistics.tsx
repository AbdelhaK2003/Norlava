import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Users, MessageSquare, Brain, Clock } from "lucide-react";

interface Stats {
  totalMessages: number;
  uniqueVisitors: number;
  learnedFacts: number;
  pendingFacts: number;
}

export const Statistics = () => {
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    uniqueVisitors: 0,
    learnedFacts: 0,
    pendingFacts: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/facts/statistics');
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch statistics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // Optionally refresh stats every 30 seconds
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      icon: MessageSquare,
      label: "Total Messages",
      value: stats.totalMessages,
      color: "from-blue-500/20 to-blue-600/10",
      borderColor: "border-blue-500/30"
    },
    {
      icon: Users,
      label: "Unique Visitors",
      value: stats.uniqueVisitors,
      color: "from-purple-500/20 to-purple-600/10",
      borderColor: "border-purple-500/30"
    },
    {
      icon: Brain,
      label: "Learned Facts",
      value: stats.learnedFacts,
      color: "from-emerald-500/20 to-emerald-600/10",
      borderColor: "border-emerald-500/30"
    },
    {
      icon: Clock,
      label: "Pending Review",
      value: stats.pendingFacts,
      color: "from-amber-500/20 to-amber-600/10",
      borderColor: "border-amber-500/30",
      highlight: stats.pendingFacts > 0
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card
              className={`p-4 bg-gradient-to-br ${stat.color} ${stat.borderColor} border transition-all hover:shadow-lg ${
                stat.highlight ? "ring-2 ring-amber-500/50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <motion.p
                    key={stat.value}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-bold text-white mt-2"
                  >
                    {loading ? "-" : stat.value}
                  </motion.p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50">
                  <Icon className="w-6 h-6 text-slate-300" />
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
