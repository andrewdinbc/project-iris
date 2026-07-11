'use client';

import { useState } from 'react';
import { AlertCircle, Upload, Loader2, Check, X } from 'lucide-react';

interface AlignmentMatch {
  id: string;
  standardId: string;
  standardCode: string;
  standardText: string;
  matchConfidence: number;
  matchReasoning: string;
  userConfirmed: boolean | null;
}

interface MatchingResult {
  lessonPlanId: string;
  lessonPlanTitle: string;
  province: string;
  matches: AlignmentMatch[];
  processingStatus: 'pending' | 'processing' | 'complete' | 'error';
  error?: string;
}

export default function CurriculumAlignmentMatcher() {
  const [lessonPlan, setLessonPlan] = useState('');
  const [province, setProvince] = useState('BC');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean | null>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLessonPlan(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonPlan.trim()) {
      alert('Please upload or paste a lesson plan');
      return;
    }

    setIsLoading(true);
    setResult({
      lessonPlanId: Date.now().toString(),
      lessonPlanTitle: 'Pending...',
      province,
      matches: [],
      processingStatus: 'processing',
    });

    try {
      const response = await fetch('/api/curriculum/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonPlan,
          province,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      setOverrides({});
    } catch (error) {
      setResult({
        lessonPlanId: Date.now().toString(),
        lessonPlanTitle: 'Error',
        province,
        matches: [],
        processingStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlignmentOverride = (matchId: string, value: boolean | null) => {
    setOverrides((prev) => ({
      ...prev,
      [matchId]: value,
    }));
  };

  const handleSaveOverrides = async () => {
    if (!result) return;

    try {
      const response = await fetch('/api/curriculum/alignments/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonPlanId: result.lessonPlanId,
          overrides,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save overrides');
      }

      alert('Alignment decisions saved successfully');
    } catch (error) {
      alert(`Error saving: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Curriculum Alignment Matcher</h1>
          <p className="text-slate-600">Upload or paste your lesson plan to find matching curriculum standards</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Province
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BC">British Columbia</option>
                    <option value="AB">Alberta</option>
                    <option value="SK">Saskatchewan</option>
                    <option value="MB">Manitoba</option>
                    <option value="ON">Ontario</option>
                    <option value="QC">Quebec</option>
                    <option value="NB">New Brunswick</option>
                    <option value="NS">Nova Scotia</option>
                    <option value="PE">Prince Edward Island</option>
                    <option value="NL">Newfoundland & Labrador</option>
                    <option value="YT">Yukon</option>
                    <option value="NT">Northwest Territories</option>
                    <option value="NU">Nunavut</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Lesson Plan
                  </label>
                  <div className="space-y-2">
                    <textarea
                      value={lessonPlan}
                      onChange={(e) => setLessonPlan(e.target.value)}
                      placeholder="Paste your lesson plan content here..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={8}
                    />
                    <label className="flex items-center justify-center w-full px-3 py-2 border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                      <Upload className="w-4 h-4 mr-2 text-slate-600" />
                      <span className="text-sm text-slate-600">Or upload a file</span>
                      <input
                        type="file"
                        accept=".txt,.pdf,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-slate-400 transition flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Matching...
                    </>
                  ) : (
                    'Find Alignments'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {result ? (
              <div className="space-y-4">
                {result.processingStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900">Error</h3>
                      <p className="text-sm text-red-700">{result.error}</p>
                    </div>
                  </div>
                )}

                {result.processingStatus === 'processing' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
                    <Loader2 className="w-5 h-5 text-blue-600 mr-3 animate-spin" />
                    <p className="text-blue-700">Analyzing lesson plan and matching against curriculum standards...</p>
                  </div>
                )}

                {result.processingStatus === 'complete' && (
                  <>
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-xl font-bold text-slate-900 mb-2">{result.lessonPlanTitle}</h2>
                      <p className="text-sm text-slate-600 mb-4">
                        Found {result.matches.length} potential alignment(s) with {result.province} curriculum standards
                      </p>

                      <div className="space-y-3">
                        {result.matches.map((match) => {
                          const override = overrides[match.id];
                          const isConfirmed = override !== undefined ? override : match.userConfirmed;

                          return (
                            <div
                              key={match.id}
                              className={`border rounded-lg p-4 transition ${
                                isConfirmed === true
                                  ? 'border-green-300 bg-green-50'
                                  : isConfirmed === false
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-slate-200 bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-slate-900 text-sm">
                                    {match.standardCode}
                                  </h3>
                                  <p className="text-sm text-slate-700 mt-1">{match.standardText}</p>
                                </div>
                                <div className="ml-4 text-right flex-shrink-0">
                                  <div className="text-xs font-semibold text-slate-600">
                                    Confidence
                                  </div>
                                  <div className="text-lg font-bold text-slate-900">
                                    {Math.round(match.matchConfidence * 100)}%
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-slate-600 mb-3 italic">
                                {match.matchReasoning}
                              </p>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAlignmentOverride(match.id, true)}
                                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-semibold transition ${
                                    isConfirmed === true
                                      ? 'bg-green-600 text-white'
                                      : 'bg-slate-200 text-slate-700 hover:bg-green-100'
                                  }`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleAlignmentOverride(match.id, false)}
                                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-semibold transition ${
                                    isConfirmed === false
                                      ? 'bg-red-600 text-white'
                                      : 'bg-slate-200 text-slate-700 hover:bg-red-100'
                                  }`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleAlignmentOverride(match.id, null)}
                                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-semibold transition ${
                                    isConfirmed === null
                                      ? 'bg-slate-400 text-white'
                                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                  }`}
                                >
                                  Skip
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {result.matches.length > 0 && (
                        <button
                          onClick={handleSaveOverrides}
                          className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition"
                        >
                          Save Alignment Decisions
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-slate-600">
                <p>Upload or paste a lesson plan to see curriculum alignments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
