import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, UserCheck, ShieldAlert } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from "recharts";
import { toast } from "sonner";
import { NavLink } from "@/components/NavLink";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Fetch admin stats
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['adminStats'],
        queryFn: async () => {
            try {
                const response = await api.get('/admin/statistics');
                return response.data;
            } catch (err: any) {
                if (err.response && err.response.status === 403) {
                    toast.error("Access Denied: Admins Only");
                    navigate('/dashboard');
                    return null;
                }
                throw err;
            }
        },
        retry: false
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4">
                <ShieldAlert className="w-16 h-16 text-red-500" />
                <h1 className="text-2xl font-bold">Access Restricted</h1>
                <p className="text-slate-400 text-center max-w-md">
                    {error instanceof Error && (error as any).response?.data?.error
                        ? (error as any).response.data.error
                        : "You do not have permission to view this page."}
                </p>
                <div className="text-xs text-slate-600 bg-slate-900 p-2 rounded border border-slate-800">
                    <p>Tip: Ensure ADMIN_EMAIL is set in Railway Variables.</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 transition"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-400 mt-1">Project Overview & Statistics</p>
                </div>
                <div className="flex items-center gap-2">
                    <NavLink to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors">
                        <UserCheck className="w-4 h-4" />
                        <span>Back to App</span>
                    </NavLink>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-indigo-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.overview.users}</div>
                            <p className="text-xs text-slate-500 mt-1">Registered accounts</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Total Profiles</CardTitle>
                            <UserCheck className="h-4 w-4 text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.overview.profiles}</div>
                            <p className="text-xs text-slate-500 mt-1">Active AI Personalities</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Total Messages</CardTitle>
                            <MessageSquare className="h-4 w-4 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.overview.messages}</div>
                            <p className="text-xs text-slate-500 mt-1">Across all conversations</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Message Activity Chart */}
                    <Card className="bg-slate-900/50 border-slate-800 col-span-2">
                        <CardHeader>
                            <CardTitle className="text-white">Message Activity (Last 30 Days)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.activity}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#94a3b8"
                                            fontSize={12}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return `${date.getMonth() + 1}/${date.getDate()}`;
                                            }}
                                        />
                                        <YAxis stroke="#94a3b8" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                            itemStyle={{ color: '#818cf8' }}
                                            formatter={(value: number) => [value, 'Messages']}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                        />
                                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
