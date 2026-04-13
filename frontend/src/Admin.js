import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Zap,
  ThumbsUp,
  Users,
  ArrowLeft,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function Admin({ onBack }) {
  const [stats, setStats] = useState(null);
  const [avgTime, setAvgTime] = useState(0);
  const [topics, setTopics] = useState([]);

  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    avg: 0,
    satisfaction: 0,
    sessions: 0,
  });

  // FETCH DATA
  useEffect(() => {
    fetch("http://localhost:8000/admin/stats")
      .then((res) => res.json())
      .then((data) => setStats(data));

    fetch("http://localhost:8000/admin/avg-response-time")
      .then((res) => res.json())
      .then((data) => setAvgTime(data.avg_response_time));

    fetch("http://localhost:8000/admin/top-topics")
      .then((res) => res.json())
      .then((data) => setTopics(data));
  }, []);

  // COUNT-UP ANIMATION
  useEffect(() => {
    if (!stats) return;

    const duration = 1500;
    const start = Date.now();

    const animate = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);

      setAnimatedStats({
        total: Math.floor(progress * (stats.total_queries || 0)),
        avg: (progress * (avgTime || 0)).toFixed(2),
        satisfaction: Math.floor(progress * (stats.satisfaction_rate || 0)),
        sessions: Math.floor(progress * (stats.active_sessions || 0)),
      });

      if (progress < 1) requestAnimationFrame(animate);
    };

    animate();
  }, [stats, avgTime]);

  const maxTopic = Math.max(...topics.map((t) => t.count), 1);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 animate-fadeIn">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time system metrics
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Backend Online
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111] border border-[#1a1a1a] hover:border-purple-600 transition"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        {[
          {
            label: "Total Queries",
            value: animatedStats.total,
            icon: <MessageSquare size={18} />,
            color: "bg-purple-500/20 text-purple-400",
          },
          {
            label: "Avg Response Time",
            value: animatedStats.avg + "s",
            icon: <Zap size={18} />,
            color: "bg-yellow-500/20 text-yellow-400",
          },
          {
            label: "Satisfaction Rate",
            value: animatedStats.satisfaction + "%",
            icon: <ThumbsUp size={18} />,
            color: "bg-green-500/20 text-green-400",
          },
          {
            label: "Active Sessions",
            value: animatedStats.sessions,
            icon: <Users size={18} />,
            color: "bg-blue-500/20 text-blue-400",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-[#111111] rounded-xl p-4 border-t-2 border-purple-600 shadow-md hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(124,58,237,0.2)] transition"
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${card.color}`}>
              {card.icon}
            </div>

            <div className="mt-4 text-2xl font-bold">{card.value}</div>
            <div className="text-gray-400 text-sm">{card.label}</div>
          </div>
        ))}
      </div>

      {/* CHART SECTION */}
      <div className="bg-[#111111] rounded-xl p-6 mb-8 border border-[#1a1a1a]">
        <h2 className="text-lg mb-4 border-l-4 border-purple-600 pl-2">
          Queries Over Time
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topics}>
            <XAxis dataKey="topic" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Bar dataKey="count">
              {topics.map((_, i) => (
                <Cell key={i} fill="#7c3aed" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TOP TOPICS */}
      <div className="bg-[#111111] rounded-xl p-6 border border-[#1a1a1a]">
        <h2 className="text-lg mb-4 border-l-4 border-purple-600 pl-2">
          Top Topics
        </h2>

        <div className="space-y-2">
          {topics.map((t, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg relative overflow-hidden ${
                i % 2 === 0 ? "bg-[#111]" : "bg-[#0f0f0f]"
              } hover:bg-[#1a1a1a] transition`}
            >
              {/* PROGRESS BAR */}
              <div
                className="absolute left-0 top-0 h-full bg-purple-600/10"
                style={{ width: `${(t.count / maxTopic) * 100}%` }}
              />

              <div className="relative flex justify-between items-center">
                <span>{t.topic}</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-xs">
                  {t.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BACKGROUND GRID */}
      <div className="pointer-events-none fixed inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:20px_20px]" />
    </div>
  );
}

export default Admin;