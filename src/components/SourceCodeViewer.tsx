import { useState } from "react";
import { Folder, FileCode, Copy, Check, Download, Info, CheckCircle } from "lucide-react";
import { androidProjectFiles } from "../androidCodebase";
import { AndroidFile } from "../types";
import JSZip from "jszip";

export default function SourceCodeViewer() {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(androidProjectFiles[0]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Simple Copy function
  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compile ZIP with JSZip
  const handleDownloadZip = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    try {
      const zip = new JSZip();
      
      // Add all project files dynamically
      androidProjectFiles.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Generate the raw blob
      const content = await zip.generateAsync({ type: "blob" });
      
      // Trigger user download
      const url = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "GrammarWizard_MCQ_Android_Project.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("ZIP Generation failed", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div id="source-code-viewer-container" className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col md:flex-row h-[720px] shadow-sm text-slate-700">
      
      {/* File Tree Sidebar */}
      <div id="sidebar-panel" className="w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-sm text-slate-800 tracking-wide">Android Project Tree</span>
          </div>
        </div>

        {/* File List */}
        <div id="file-list" className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {androidProjectFiles.map((file) => {
            const isSelected = selectedFile.name === file.name;
            return (
              <button
                id={`sidebar-file-${file.name.replace(/\s+/g, "-")}`}
                key={file.name}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-all flex items-start gap-2.5 border ${
                  isSelected
                    ? "bg-indigo-50 border-indigo-200 text-indigo-950 font-bold shadow-xs"
                    : "bg-white border-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                <div className="truncate">
                  <div className="font-bold">{file.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{file.path}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Download Bundle Action */}
        <div id="download-panel" className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            id="btn-download-zip"
            onClick={handleDownloadZip}
            disabled={downloading}
            className={`w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100 ${
              downloadSuccess ? "bg-emerald-600 hover:bg-emerald-700" : ""
            }`}
          >
            {downloading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full"></span>
            ) : downloadSuccess ? (
              <CheckCircle className="w-4 h-4 text-white" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {downloading ? "Bundling Code..." : downloadSuccess ? "Project Exported!" : "Download Project ZIP"}
            </span>
          </button>
          <div className="mt-2.5 flex items-start gap-1.5 text-[10px] text-slate-500 leading-normal">
            <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
            <span>Imports directly into Android Studio as a production-grade Kotlin build!</span>
          </div>
        </div>
      </div>

      {/* Code Editor Preview */}
      <div id="editor-panel" className="flex-1 flex flex-col bg-white min-w-0 relative">
        
        {/* Editor Tab bar */}
        <div id="editor-header" className="h-12 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 select-none">
          <span className="text-xs font-mono text-indigo-600 font-bold truncate">{selectedFile.path}</span>
          <button
            id="btn-copy-code"
            onClick={handleCopy}
            className="text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-xs font-semibold"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>

        {/* Editor Screen */}
        <div id="editor-body" className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed bg-slate-950 text-slate-300">
          <pre className="flex">
            {/* Line numbers column */}
            <div className="text-right select-none text-slate-600 pr-4 border-r border-slate-900/60 select-none">
              {selectedFile.content.split("\n").map((_, i) => (
                <div key={i} className="leading-6">{i + 1}</div>
              ))}
            </div>
            {/* Actual code contents */}
            <code id="editor-code" className="pl-4 block whitespace-pre leading-6 font-mono text-slate-200">
              {selectedFile.content}
            </code>
          </pre>
        </div>

      </div>
    </div>
  );
}
