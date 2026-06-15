import Link from "next/link";
import { ArrowRight, Brain, Calculator, FileText, Layers, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-foam-slate to-slate-800 text-white">
      {/* Nav */}
      <nav className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-foam-orange rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">Spray Foam Estimator AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="bg-foam-orange hover:bg-foam-orange-light text-white px-5 py-2 rounded-lg font-medium transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-20 pb-28 text-center">
        <div className="inline-flex items-center gap-2 bg-foam-orange/20 border border-foam-orange/30 text-foam-orange-light px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <Brain className="w-4 h-4" />
          Powered by Claude AI Vision
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Upload Plans.
          <br />
          <span className="text-foam-orange">Get Estimates in Minutes.</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
          AI reads your blueprints, extracts every dimension, and calculates
          exact board feet, R-values, and material costs — automatically.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/sign-up"
            className="bg-foam-orange hover:bg-foam-orange-light text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center gap-2"
          >
            Start Estimating Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/sign-in"
            className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-900/50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything Your Estimators Need
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: "AI Plan Reading",
                desc: "Claude vision AI extracts dimensions, wall types, and room labels from any architectural plan.",
              },
              {
                icon: <Calculator className="w-6 h-6" />,
                title: "Automatic Calculations",
                desc: "Board feet, R-values, thickness, waste factor — all calculated instantly from the extracted dimensions.",
              },
              {
                icon: <Layers className="w-6 h-6" />,
                title: "Visual Overlay",
                desc: "See measurements overlaid on your original plan. Click any wall to edit dimensions.",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Multi-Floor Support",
                desc: "Handle basement, first floor, second floor, and attic separately with per-floor totals.",
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Proposal Generator",
                desc: "One-click customer-ready PDF proposals with material breakdown, pricing, and your branding.",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Confidence Scoring",
                desc: "Every measurement comes with a confidence score. Low confidence items flagged for your review.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-6"
              >
                <div className="w-12 h-12 bg-foam-orange/20 rounded-lg flex items-center justify-center text-foam-orange mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            From Plans to Proposal in 3 Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Upload Your Plans", desc: "Drag & drop PDFs, blueprints, or images. We handle multi-page documents automatically." },
              { step: "02", title: "AI Analyzes Plans", desc: "Claude reads scale, dimensions, wall types, and notes. Confidence-scored results in under 2 minutes." },
              { step: "03", title: "Review & Generate", desc: "Edit any measurement, adjust foam types and R-values, then export a polished customer proposal." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-bold text-foam-orange/30 mb-4">{s.step}</div>
                <h3 className="font-semibold text-xl mb-3">{s.title}</h3>
                <p className="text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foam-orange py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Save Hours on Every Estimate
          </h2>
          <p className="text-orange-100 mb-8 text-lg">
            Get exterior wall SF, roof deck SF, rim joist LF, and a complete
            proposal in under 2 minutes.
          </p>
          <Link
            href="/sign-up"
            className="bg-white text-foam-orange hover:bg-orange-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors inline-flex items-center gap-2"
          >
            Start Free Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Spray Foam Estimator AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
