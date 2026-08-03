"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Lock,
  Trophy,
  BarChart3,
  RefreshCw,
  LogOut,
  Users,
  Vote,
  CheckCircle2,
  ShieldAlert,
  Crown,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface CandidateResult {
  id: string;
  name: string;
  order: number;
  voteCount: number;
  percentage: string;
}

interface ResultsData {
  candidates: CandidateResult[];
  totalVotes: number;
  leaders: string[];
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Dashboard Results state
  const [results, setResults] = useState<ResultsData | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Reset Votes modal state
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Fetch admin results from API
  const fetchResults = useCallback(async () => {
    try {
      setIsLoadingResults(true);
      const res = await fetch("/api/admin/results");

      if (res.status === 401) {
        setIsAuthenticated(false);
        setResults(null);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setIsAuthenticated(true);
        setResults(data);
        setLastUpdated(new Date());
        setFetchError(null);
      } else {
        setFetchError(data.error || "Failed to fetch live election results.");
      }
    } catch (err) {
      setFetchError("Network error polling election results.");
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  // Initial auth check & Polling loop every 4 seconds
  useEffect(() => {
    fetchResults();

    const interval = setInterval(() => {
      fetchResults();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchResults]);

  // Admin login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isLoggingIn) return;

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPassword("");
        fetchResults();
      } else {
        setLoginError(data.error || "Invalid admin password.");
      }
    } catch (err) {
      setLoginError("Connection error during authentication.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsAuthenticated(false);
      setResults(null);
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  // Reset votes handler
  const handleResetVotes = async () => {
    if (isResetting) return;

    setIsResetting(true);
    try {
      const res = await fetch("/api/admin/reset-votes", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResetSuccessMsg("All candidate votes have been reset to 0.");
        setShowResetModal(false);
        await fetchResults();

        setTimeout(() => {
          setResetSuccessMsg(null);
        }, 4000);
      } else {
        setFetchError(data.error || "Failed to reset votes.");
      }
    } catch (err) {
      setFetchError("Connection error resetting votes.");
    } finally {
      setIsResetting(false);
    }
  };

  // Loading spinner during auth check
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white p-6">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-slate-300">Checking election admin credentials...</p>
      </div>
    );
  }

  // Render Login Form if unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 md:p-8 select-none">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-10 shadow-2xl border-4 border-gold-500">
          {/* Logo Badge in Login Card */}
          <div className="w-20 h-20 bg-navy-950 rounded-2xl flex items-center justify-center border-2 border-amber-400 mx-auto mb-6 shadow-md overflow-hidden p-1">
            <img src="/ln-logo.png" alt="LN College Logo" className="w-full h-full object-contain" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-navy-950 text-center uppercase tracking-tight">
            LN College
          </h2>
          <p className="text-gold-600 font-bold text-center text-xs tracking-widest uppercase mt-1 mb-8">
            Election Committee Login
          </p>

          {loginError && (
            <div className="mb-6 bg-red-100 border-2 border-red-500 text-red-800 p-3 rounded-xl flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-extrabold uppercase tracking-wider text-navy-900 mb-2"
              >
                Admin Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/20 font-medium text-navy-950 outline-none transition-all text-base"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold text-lg uppercase tracking-wider transition-all duration-200 border-2 border-gold-500 shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Access Results Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center flex flex-col gap-3 items-center">
            <a
              href="/"
              className="text-xs text-slate-500 hover:text-navy-900 font-bold uppercase tracking-wider underline underline-offset-4"
            >
              ← Back to Kiosk Terminal
            </a>
            <p className="text-xs text-slate-400 font-semibold">
              Designed &amp; Developed by Saif Ansari
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard
  const totalVotes = results?.totalVotes || 0;
  const candidatesList = results?.candidates || [];
  const leaderIds = results?.leaders || [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col p-4 md:p-8">
      {/* Top Header Navigation with LN College Logo */}
      <header className="bg-navy-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border-b-4 border-gold-500 max-w-7xl mx-auto w-full mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-navy-950 rounded-2xl flex items-center justify-center border-2 border-amber-400 overflow-hidden p-1 shadow-md shrink-0">
              <img src="/ln-logo.png" alt="LN College Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-3xl font-black uppercase tracking-wide">
                  ELECTION RESULTS DASHBOARD
                </h1>
                <div className="flex items-center gap-1.5 bg-amber-500/20 text-gold-400 border border-gold-500/40 px-3 py-1 rounded-full text-xs font-bold uppercase">
                  <span className="w-2.5 h-2.5 bg-gold-400 rounded-full animate-pulse" />
                  Live Polling
                </div>
              </div>
              <p className="text-slate-300 text-xs md:text-sm mt-1 font-medium">
                General Secretary Election 2026 • Live Kiosk Feed
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Delete / Reset All Votes Button */}
            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md active:scale-95 border border-amber-500"
              title="Delete or Reset All Votes"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset All Votes</span>
            </button>

            <button
              onClick={() => fetchResults()}
              disabled={isLoadingResults}
              className="p-3 bg-navy-800 hover:bg-navy-700 text-gold-400 rounded-xl border border-navy-700 transition-all active:scale-95 flex items-center gap-2 text-xs font-bold"
              title="Manual Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingResults ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-white rounded-xl border border-navy-700 text-xs font-bold transition-all"
            >
              Open Kiosk View ↗
            </a>

            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto w-full flex-1 space-y-8">
        {resetSuccessMsg && (
          <div className="bg-green-100 border-2 border-green-500 text-green-800 p-4 rounded-2xl flex items-center gap-3 shadow-md animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
            <span className="font-bold">{resetSuccessMsg}</span>
          </div>
        )}

        {fetchError && (
          <div className="bg-red-100 border-2 border-red-500 text-red-800 p-4 rounded-2xl flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
            <span className="font-semibold">{fetchError}</span>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Total Votes Card */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                Total Votes Cast
              </p>
              <h3 className="text-4xl md:text-5xl font-black text-navy-950 mt-1">
                {totalVotes}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Across all active kiosk terminals
              </p>
            </div>
            <div className="w-16 h-16 bg-navy-50 text-navy-900 rounded-2xl flex items-center justify-center border border-navy-100">
              <Vote className="w-8 h-8" />
            </div>
          </div>

          {/* Leader Card */}
          <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-3xl p-6 shadow-lg border-2 border-gold-500 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-gold-400">
                Leading Candidate
              </p>
              <h3 className="text-2xl md:text-3xl font-black text-white mt-1">
                {leaderIds.length > 0
                  ? candidatesList
                      .filter((c) => leaderIds.includes(c.id))
                      .map((c) => c.name)
                      .join(", ")
                  : "No votes yet"}
              </h3>
              <p className="text-xs text-slate-300 font-semibold mt-1">
                {leaderIds.length > 1 ? "Tied for first place" : "Current vote leader"}
              </p>
            </div>
            <div className="w-16 h-16 bg-gold-500 text-navy-950 rounded-2xl flex items-center justify-center shadow-lg border-2 border-amber-300">
              <Crown className="w-9 h-9 fill-navy-950" />
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                Election Status
              </p>
              <h3 className="text-2xl md:text-3xl font-black text-green-600 mt-1 flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-green-500 rounded-full animate-ping inline-block" />
                ACTIVE
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Auto-refreshing every 4 seconds
              </p>
            </div>
            <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center border border-green-100">
              <BarChart3 className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Candidate Results Grid & Progress Bars */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-2 border-slate-200">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tight">
                Candidate Tally & Visual Analytics
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                Live breakdown of votes per candidate
              </p>
            </div>
            {lastUpdated && (
              <span className="text-xs text-slate-400 font-semibold">
                Updated at: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="space-y-8">
            {candidatesList.map((candidate) => {
              const isLeader = leaderIds.includes(candidate.id);
              const percentageNum = parseFloat(candidate.percentage);

              return (
                <div
                  key={candidate.id}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    isLeader
                      ? "bg-amber-50/50 border-gold-400 shadow-md"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                          isLeader
                            ? "bg-gold-500 text-navy-950 shadow-md"
                            : "bg-navy-900 text-white"
                        }`}
                      >
                        #{candidate.order}
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl md:text-2xl font-extrabold text-navy-950">
                            {candidate.name}
                          </h3>
                          {isLeader && totalVotes > 0 && (
                            <span className="bg-gold-500 text-navy-950 text-xs font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                              <Trophy className="w-3.5 h-3.5" />
                              Leader
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          Ballot Position #{candidate.order}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-black text-navy-950">
                        {candidate.voteCount}{" "}
                        <span className="text-lg font-bold text-slate-500">votes</span>
                      </div>
                      <p className="text-sm font-extrabold text-gold-600">
                        {candidate.percentage}% of total
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar Visualization */}
                  <div className="w-full bg-slate-200 h-6 rounded-full overflow-hidden p-1 border border-slate-300">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLeader
                          ? "bg-gradient-to-r from-gold-600 to-gold-400"
                          : "bg-navy-900"
                      }`}
                      style={{ width: `${Math.max(percentageNum, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Delete / Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-4 border-amber-500 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-navy-950 text-center uppercase tracking-tight">
              Reset All Election Votes?
            </h3>
            <p className="text-slate-600 text-center text-sm font-medium mt-2 mb-6">
              This action will reset candidate vote tallies back to 0 and clear all vote audit logs in MongoDB. This cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetVotes}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Yes, Delete All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 font-semibold text-xs border-t border-slate-200 mt-8 py-6">
        <span>LN College Election Committee • Admin Results Dashboard</span>
        <span className="text-navy-900 font-extrabold">Designed &amp; Developed by Saif Ansari</span>
      </footer>
    </div>
  );
}
