import { useState } from "react";
import { 
  Smartphone, FolderCode, Sparkles, ShieldCheck, Layers, BookOpen, Download, AlertCircle, Cpu
} from "lucide-react";
import PhoneSimulator from "./components/PhoneSimulator";
import SourceCodeViewer from "./components/SourceCodeViewer";

export default function App() {
  const [activeTab, setActiveTab] = useState<"simulator" | "code">("simulator");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* App Bar (Professional Polish styled) */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-100 shadow-lg">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight">Grammar Wizard</h1>
              <p className="text-[10px] text-slate-500 font-mono">MCQ Generator • Standalone Android Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connected status badge from design spec */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 shadow-xs">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Gemini 1.5 Flash Connected</span>
            </div>

            {/* Interactive Workspace Tab Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="tab-selector-simulator"
                onClick={() => setActiveTab("simulator")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  activeTab === "simulator"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Interactive Simulator</span>
              </button>
              <button
                id="tab-selector-code"
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  activeTab === "code"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FolderCode className="w-3.5 h-3.5" />
                <span>Android Studio Code</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Pane */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Workspace Display Area */}
        <div className="flex-1 min-w-0">
          {activeTab === "simulator" ? (
            <div className="flex flex-col items-center">
              <div className="text-center max-w-lg mb-6 select-none">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-700 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100">
                  Android Live Replica
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mt-3 tracking-tight">Test-drive the MCQ Generator</h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Experience the exact layout, state logic, and native-flow responses configured for our Android 14+ Kotlin codebase in real time.
                </p>
              </div>
              <PhoneSimulator />
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="max-w-xl mb-6">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-700 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100">
                  Production-Ready Android Assets
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mt-3 tracking-tight">Full Native Source Code</h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Browse the fully written Kotlin, Jetpack Compose, XML, and Gradle files compiled from scratch. Use the download button below to export the entire project structure as a ZIP archive for 1-click import into Android Studio!
                </p>
              </div>
              <SourceCodeViewer />
            </div>
          )}
        </div>

        {/* Feature Sidebar Details */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          
          {/* Quick Info Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Android Spec Checklist</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5 border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">First-Run Setup</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                    Locks features behind Gemini key configuration. Keys are stored safely using EncryptedSharedPreferences (localStorage on browser).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5 border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Jetpack Compose Layout</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                    Written with Google’s modern declarative design pattern. Large tap targets, dynamic loading, and fluid animations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5 border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">State ViewModel</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                    Integrates <code>androidx.lifecycle.ViewModel</code> keeping quiz choices perfectly intact during screen rotations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5 border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Retrofit API Client</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                    Full Retrofit post requests with GSON schema bindings, error capture handlers, and loading states.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>How to Compile APK</span>
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              To turn this codebase into a downloadable <strong>APK</strong> for your phone:
            </p>
            <ol className="list-decimal list-inside text-[10px] text-slate-400 mt-2 space-y-1.5 leading-normal">
              <li>Navigate to the <strong>Android Studio Code</strong> tab.</li>
              <li>Click <strong>Download Project ZIP</strong>.</li>
              <li>Extract the ZIP and open the folder in <strong>Android Studio</strong>.</li>
              <li>Select <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.</li>
            </ol>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white select-none py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[11px] text-slate-400">
            Grammar Wizard: MCQ Generator © 2026 • Crafted in Native Kotlin & Jetpack Compose
          </p>
        </div>
      </footer>

    </div>
  );
}
