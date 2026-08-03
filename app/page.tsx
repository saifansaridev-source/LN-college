"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Vote, ShieldCheck, AlertCircle, User, Lock } from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  order: number;
  image: string;
}

export default function VotingKioskPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [votedCandidateName, setVotedCandidateName] = useState<string>("");

  // Fetch candidates list on mount
  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/candidates");
      const data = await res.json();
      if (data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
      } else {
        // Fallback default candidates if API returns empty
        setCandidates([
          { id: "1", name: "Ankush Pandey", order: 1, image: "/candidates/ankush-pandey.jpg" },
          { id: "2", name: "Mohammad Hamza", order: 2, image: "/candidates/mohammad-hamza.jpg" },
          { id: "3", name: "Bhushan Chapetkar", order: 3, image: "/candidates/bhushan-chapetkar.jpg" },
          { id: "4", name: "Kasim Shaikh", order: 4, image: "/candidates/kasim-shaikh.jpg" },
        ]);
      }
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setCandidates([
        { id: "1", name: "Ankush Pandey", order: 1, image: "/candidates/ankush-pandey.jpg" },
        { id: "2", name: "Mohammad Hamza", order: 2, image: "/candidates/mohammad-hamza.jpg" },
        { id: "3", name: "Bhushan Chapetkar", order: 3, image: "/candidates/bhushan-chapetkar.jpg" },
        { id: "4", name: "Kasim Shaikh", order: 4, image: "/candidates/kasim-shaikh.jpg" },
      ]);
    }
  };

  useEffect(() => {
    fetchCandidates();
    
    // Prevent back-button viewing of prior states
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Submit vote handler
  const handleVoteSubmit = useCallback(async () => {
    if (!selectedCandidateId || isSubmitting || showConfirmation) return;

    const candidate = candidates.find((c) => c.id === selectedCandidateId);
    if (!candidate) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selectedCandidateId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVotedCandidateName(candidate.name);
        setShowConfirmation(true);

        // After 2 seconds confirmation, full page refresh for next voter
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setErrorMsg(data.error || "Failed to record vote. Please try again.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMsg("Connection error while submitting vote.");
      setIsSubmitting(false);
    }
  }, [selectedCandidateId, isSubmitting, showConfirmation, candidates]);

  // Keyboard shortcut listener (Number keys 1-4 to select, Enter to confirm)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showConfirmation) return;

      if (e.key === "Enter") {
        e.preventDefault();
        if (selectedCandidateId) {
          handleVoteSubmit();
        }
      } else if (["1", "2", "3", "4"].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (candidates[index]) {
          setSelectedCandidateId(candidates[index].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCandidateId, handleVoteSubmit, candidates, showConfirmation]);

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between p-4 md:p-8 select-none">
      {/* Header Banner with Official LN College Logo */}
      <header className="bg-navy-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border-b-4 border-gold-500 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shadow-md border-2 border-amber-400 bg-navy-950 flex items-center justify-center shrink-0">
              <img
                src="/ln-logo.png"
                alt="LN College Crest Logo"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-wide uppercase text-white">
                LN COLLEGE
              </h1>
              <p className="text-gold-400 font-semibold tracking-widest text-xs md:text-sm uppercase mt-1">
                GENERAL SECRETARY ELECTION 2026
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-navy-800/80 px-4 py-2 rounded-full border border-navy-700 text-xs md:text-sm text-slate-300">
            <ShieldCheck className="w-4 h-4 text-gold-400" />
            <span>Supervised Official Kiosk Terminal</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full my-6 flex-1 flex flex-col justify-center">
        {/* Instruction Message */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-black text-navy-900">
            Cast Your Vote for General Secretary
          </h2>
          <p className="text-slate-600 text-lg mt-2 font-medium">
            Tap your candidate below, then press <span className="font-bold text-navy-900">Confirm Vote</span> or press <kbd className="px-2.5 py-1 bg-white border-2 border-slate-300 rounded-lg text-sm font-bold shadow-sm">Enter</kbd>
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 bg-red-100 border-2 border-red-500 text-red-800 p-4 rounded-2xl flex items-center gap-3 max-w-2xl mx-auto shadow-md">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <span className="font-semibold text-lg">{errorMsg}</span>
          </div>
        )}

        {/* Candidate Cards Grid with Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10">
          {candidates.map((candidate) => {
            const isSelected = selectedCandidateId === candidate.id;
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => setSelectedCandidateId(candidate.id)}
                className={`relative group flex items-center justify-between p-5 md:p-6 rounded-3xl transition-all duration-200 border-4 text-left shadow-lg active:scale-[0.98] ${
                  isSelected
                    ? "bg-navy-900 border-gold-500 text-white shadow-2xl ring-4 ring-gold-400/50 translate-y-[-2px]"
                    : "bg-white border-slate-200 hover:border-gold-400 text-navy-900 hover:shadow-xl"
                }`}
              >
                <div className="flex items-center gap-5">
                  {/* Candidate Photo */}
                  <div className="relative w-20 h-24 md:w-24 md:h-28 rounded-2xl overflow-hidden border-2 border-gold-500/50 shadow-md shrink-0 bg-slate-200">
                    {candidate.image ? (
                      <img
                        src={candidate.image}
                        alt={candidate.name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 -z-10">
                      <User className="w-10 h-10" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm ${
                          isSelected
                            ? "bg-gold-500 text-navy-950"
                            : "bg-navy-100 text-navy-900"
                        }`}
                      >
                        #{candidate.order}
                      </span>
                      <p
                        className={`text-xs uppercase tracking-wider font-extrabold ${
                          isSelected ? "text-gold-400" : "text-slate-500"
                        }`}
                      >
                        Candidate #{candidate.order}
                      </p>
                    </div>

                    <h3
                      className={`text-2xl md:text-3xl font-black tracking-tight ${
                        isSelected ? "text-white" : "text-navy-900"
                      }`}
                    >
                      {candidate.name}
                    </h3>
                  </div>
                </div>

                {/* Selection Check Circle */}
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-3 flex items-center justify-center transition-all shrink-0 ml-3 ${
                    isSelected
                      ? "bg-gold-500 border-gold-400 text-navy-950 scale-110"
                      : "border-slate-300 group-hover:border-gold-400"
                  }`}
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                  ) : (
                    <span className="text-slate-400 font-bold text-sm">Select</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit Action Bar */}
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            disabled={!selectedCandidateId || isSubmitting}
            onClick={handleVoteSubmit}
            className={`w-full max-w-xl py-5 md:py-6 px-8 rounded-3xl font-black text-2xl md:text-3xl uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-4 shadow-xl ${
              selectedCandidateId && !isSubmitting
                ? "bg-gold-500 hover:bg-gold-400 text-navy-950 border-4 border-amber-300 shadow-gold-500/25 active:scale-95 cursor-pointer"
                : "bg-slate-300 text-slate-500 cursor-not-allowed border-4 border-slate-300 opacity-80"
            }`}
          >
            <Vote className="w-8 h-8 md:w-10 md:h-10" />
            <span>{isSubmitting ? "Recording Vote..." : "Confirm Vote"}</span>
          </button>
          
          <p className="text-slate-500 text-sm font-semibold tracking-wide">
            {selectedCandidateId
              ? "Press 'Confirm Vote' button or hit Enter key to complete"
              : "Please select a candidate above to proceed"}
          </p>
        </div>
      </main>

      {/* Confirmation Modal Overlay */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-navy-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 md:p-12 max-w-lg w-full text-center shadow-2xl border-4 border-gold-500 transform scale-105">
            <div className="w-24 h-24 bg-green-100 border-4 border-green-500 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 className="w-16 h-16 stroke-[2.5]" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-navy-950 mb-3">
              Vote Recorded!
            </h3>
            <p className="text-slate-600 font-semibold text-lg mb-6">
              Thank you for participating in the LN College Student Election.
            </p>
            <div className="bg-navy-50 p-4 rounded-2xl border border-navy-100">
              <p className="text-xs uppercase tracking-widest font-bold text-navy-700 mb-1">
                Your vote for
              </p>
              <p className="text-xl font-extrabold text-navy-950">
                {votedCandidateName}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                has been logged securely into MongoDB database.
              </p>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-gold-600 font-bold text-sm">
              <div className="w-3 h-3 bg-gold-500 rounded-full animate-ping" />
              <span>Refreshing kiosk page for next voter...</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="pt-6 pb-2 border-t border-slate-200/60 max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-4">
          <span>LN College Election Committee • Terminal #1</span>
        </div>

        {/* Saif Ansari Credit Line */}
        <div className="text-slate-600 font-extrabold tracking-wide">
          Designed &amp; Developed by <span className="text-navy-900 font-black">Saif Ansari</span>
        </div>

        {/* Corner Admin Panel Button */}
        <div>
          <a
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-navy-900 hover:bg-navy-800 text-gold-400 border border-gold-500/40 text-xs font-extrabold transition-all shadow-sm hover:shadow active:scale-95"
            title="Admin Login Dashboard"
          >
            <Lock className="w-3.5 h-3.5 text-gold-400" />
            <span>Admin Login</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
