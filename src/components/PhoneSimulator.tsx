import React, { useState, useEffect } from "react";
import { 
  Key, BookOpen, Sparkles, Check, X, RotateCcw, ShieldAlert, ChevronLeft, ChevronRight, HelpCircle, History, Trash2, Calendar,
  User, LogIn, LogOut, Cloud, CloudOff, Lock, Mail, RefreshCw, Volume2, VolumeX, Settings, Flame, Trophy, Zap, Lightbulb, Award,
  MoreVertical, SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { QuizQuestion, QuizState, QuizHistoryItem } from "../types";
import { auth, db } from "../lib/firebase";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { 
  collection, 
  setDoc, 
  doc, 
  getDocs, 
  query, 
  deleteDoc
} from "firebase/firestore";

interface Preset {
  title: string;
  shortTitle: string;
  text: string;
}

const PRESET_POOL: Preset[] = [
  {
    title: "Active & Passive Voice",
    shortTitle: "Passive Voice",
    text: "Active and Passive Voice. For active voice, the subject acts. e.g., 'Sam wrote a book.' For passive voice, the action falls on the subject. e.g., 'A book was written by Sam.' For present perfect passive, use 'has/have been + past participle'. e.g., 'The letters have been posted.'"
  },
  {
    title: "Conditionals (1st & 2nd)",
    shortTitle: "Conditionals",
    text: "Conditionals. First Conditional: real possibility in the future. Formula: If + simple present, will + infinitive. e.g., 'If it rains, we will stay home.' Second Conditional: imaginary or unlikely. Formula: If + simple past, would + infinitive. e.g., 'If I won the lottery, I would buy a castle.'"
  },
  {
    title: "Subject-Verb Agreement",
    shortTitle: "Subject-Verb",
    text: "Subject-Verb Agreement. Singular subjects take singular verbs, plural subjects take plural verbs. Collective nouns can be singular or plural depending on context. e.g., 'The team is playing well.' 'Neither the teacher nor the students were present.'"
  },
  {
    title: "Reported Speech (Indirect)",
    shortTitle: "Indirect Speech",
    text: "Indirect Speech (Reported Speech). When reporting speech, tenses usually shift back. Simple present becomes simple past, simple past becomes past perfect, present perfect becomes past perfect. e.g., Direct: 'I am tired,' she said. Indirect: She said that she was tired."
  },
  {
    title: "Relative Clauses",
    shortTitle: "Relative Clauses",
    text: "Relative Clauses. Defining relative clauses give essential information. Non-defining clauses add extra, non-essential details. Use 'who' for people, 'which' for things, and 'whose' for possession. e.g., 'The man who lives next door is a doctor.' 'My car, which is 10 years old, broke down.'"
  },
  {
    title: "Modals of Deduction",
    shortTitle: "Modals (Deduction)",
    text: "Modals of Deduction. Use 'must' when you are 100% sure something is true. Use 'can't' when you are 100% sure it's impossible. Use 'might', 'may', or 'could' when it is possible but not certain. e.g., 'She must have missed her train because she isn't here yet.'"
  },
  {
    title: "Gerunds vs Infinitives",
    shortTitle: "Gerunds/Inf",
    text: "Gerunds vs Infinitives. Some verbs are followed only by gerunds (verb-ing) like 'enjoy', 'avoid'. Other verbs are followed only by infinitives (to + verb) like 'decide', 'hope'. e.g., 'I enjoy swimming.' 'I decided to study.'"
  },
  {
    title: "Past Perfect vs Simple Past",
    shortTitle: "Past Perfect",
    text: "Past Perfect vs Simple Past. Use the Simple Past for consecutive actions in the past. Use the Past Perfect (had + past participle) to describe an action that happened before another past action. e.g., 'When we arrived at the cinema, the film had already started.'"
  }
];

export default function PhoneSimulator() {
  // Mobile app screens: 'setup' | 'input' | 'loading' | 'quiz' | 'results'
  const [screen, setScreen] = useState<"setup" | "input" | "loading" | "quiz" | "results">("setup");
  
  // Storage mirroring EncryptedSharedPreferences
  const [apiKey, setApiKey] = useState("");
  const [grammarText, setGrammarText] = useState("");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quiz Input Mode: "text" | "topic" | "file"
  const [inputMode, setInputMode] = useState<"text" | "topic" | "file">("text");
  
  // Custom topic input value
  const [topicInput, setTopicInput] = useState("");

  // File upload state for pictures or documents
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);

  // Sound configuration
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("grammar_wizard_sound_enabled");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Persist sound settings
  useEffect(() => {
    try {
      localStorage.setItem("grammar_wizard_sound_enabled", JSON.stringify(soundEnabled));
    } catch (e) {
      console.error(e);
    }
  }, [soundEnabled]);

  // Dynamic Gamification & Psychological Hook States
  const [xp, setXp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("grammar_wizard_xp");
      return saved !== null ? Number(saved) : 120; // Default starts at 120 XP to give them some achievement
    } catch {
      return 120;
    }
  });

  const [streak, setStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("grammar_wizard_streak");
      const savedDate = localStorage.getItem("grammar_wizard_last_completed_date");
      const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local format
      
      if (!savedDate) {
        // Initialize last completed date to yesterday so the 3-day default streak hook remains intact
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString("en-CA");
        localStorage.setItem("grammar_wizard_last_completed_date", yesterdayStr);
        return saved !== null ? Number(saved) : 3;
      }
      
      const d1 = new Date(savedDate);
      const d2 = new Date(todayStr);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        // Streak is broken (skipped a whole calendar day or more)
        localStorage.setItem("grammar_wizard_streak", "0");
        return 0;
      }
      return saved !== null ? Number(saved) : 3;
    } catch {
      return 3;
    }
  });

  // Level-up feedback notification list (e.g., "+15 XP", "+100 XP Level Up!")
  const [xpFeedbacks, setXpFeedbacks] = useState<{ id: string; text: string }[]>([]);

  // Motivational toast states
  const [activeQuote, setActiveQuote] = useState<string | null>(null);
  const [activeAuthor, setActiveAuthor] = useState<string | null>(null);
  const [showQuoteToast, setShowQuoteToast] = useState(false);

  // Motivational quote pool
  const motivationalQuotes = [
    { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
    { text: "Consistency is the master key. Every question answered brings you closer to eloquence!", author: "Wizard Mindset" },
    { text: "Mistakes are proof that you are trying. Correct them, conquer the syntax!", author: "Grammar Scroll" },
    { text: "Success is the sum of small efforts, repeated day in and day out. Keep going!", author: "Robert Collier" },
    { text: "The expert in anything was once a beginner. Your mental vocabulary is expanding!", author: "Syntax Sage" },
    { text: "Your brain is a muscle. Each correct MCQ is a high-intensity synaptic connection!", author: "Cognitive Science" },
    { text: "Grammar is the architecture of thought. You are building an absolute masterpiece!", author: "Ancient Scroll" },
    { text: "Small victories lead to grand mastery. Level up your communication skill right now!", author: "Wizard Scroll" }
  ];

  const triggerMotivationalQuote = () => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    const quote = motivationalQuotes[randomIndex];
    setActiveQuote(quote.text);
    setActiveAuthor(quote.author);
    setShowQuoteToast(true);
  };

  const triggerXpFeedback = (text: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setXpFeedbacks(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setXpFeedbacks(prev => prev.filter(item => item.id !== id));
    }, 2500);
  };

  // Persist XP and Streak settings
  useEffect(() => {
    try {
      localStorage.setItem("grammar_wizard_xp", xp.toString());
      localStorage.setItem("grammar_wizard_streak", streak.toString());
    } catch (e) {
      console.error(e);
    }
  }, [xp, streak]);

  // Welcome quote popup after launch
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerMotivationalQuote();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Dismiss quote after 4.5 seconds
  useEffect(() => {
    if (showQuoteToast) {
      const timer = setTimeout(() => {
        setShowQuoteToast(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showQuoteToast]);

  const currentLevel = Math.floor(xp / 100) + 1;
  const levelProgress = xp % 100; // progress from 0 to 99
  
  const getLevelTitle = (lvl: number) => {
    if (lvl === 1) return "Apprentice Novice 🔮";
    if (lvl === 2) return "Syntax Scribe 📜";
    if (lvl === 3) return "Verb Spellweaver ⚡";
    if (lvl === 4) return "Lexicon Wizard 🧪";
    if (lvl === 5) return "Grammar Archmage 👑";
    return "Supreme Spellweaver 🌟";
  };

  // Active Tab inside 'input' screen: 'create' | 'history'
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  // Toggle state to hide/show quiz difficulty and MCQ count
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // History & presets state
  const [presets, setPresets] = useState<Preset[]>([]);
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  // Active Quiz State
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    userAnswers: {},
    isSubmitted: false,
    score: 0,
  });

  // Explanation states
  const [expandedExplanations, setExpandedExplanations] = useState<{ [key: number]: boolean }>({});
  const [loadingExplanations, setLoadingExplanations] = useState<{ [key: number]: boolean }>({});
  const [fetchedExplanations, setFetchedExplanations] = useState<{ [key: number]: string }>({});

  // Firebase Auth & Synchronization State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [syncingWithCloud, setSyncingWithCloud] = useState(false);

  // Sync local history with Cloud Firestore
  const syncHistoryWithCloud = async (user: FirebaseUser, localHistoryList: QuizHistoryItem[]) => {
    setSyncingWithCloud(true);
    try {
      const q = query(collection(db, "users", user.uid, "quizHistory"));
      const querySnapshot = await getDocs(q);
      const cloudHistoryList: QuizHistoryItem[] = [];
      querySnapshot.forEach((docSnap) => {
        cloudHistoryList.push({ id: docSnap.id, ...docSnap.data() } as QuizHistoryItem);
      });

      const mergedMap = new Map<string, QuizHistoryItem>();
      
      cloudHistoryList.forEach(item => {
        mergedMap.set(item.id, item);
      });

      localHistoryList.forEach(item => {
        if (mergedMap.has(item.id)) {
          const existing = mergedMap.get(item.id)!;
          if (existing.score === null && item.score !== null) {
            mergedMap.set(item.id, item);
          }
        } else {
          mergedMap.set(item.id, item);
        }
      });

      const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setHistory(mergedList);
      localStorage.setItem("grammar_wizard_quiz_history", JSON.stringify(mergedList));

      // Batch save back to Firestore
      for (const item of mergedList) {
        await setDoc(doc(db, "users", user.uid, "quizHistory", item.id), item);
      }
    } catch (e) {
      console.error("Error syncing history with Cloud Firestore:", e);
    } finally {
      setSyncingWithCloud(false);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const savedHistoryStr = localStorage.getItem("grammar_wizard_quiz_history") || "[]";
        let localHist: QuizHistoryItem[] = [];
        try {
          localHist = JSON.parse(savedHistoryStr);
        } catch (_) {}
        syncHistoryWithCloud(user, localHist);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load Key, History, and Randomize Presets on Startup
  useEffect(() => {
    const saved = localStorage.getItem("secure_pref_gemini_api_key") || "";
    setApiKey(saved);

    // Load History from localStorage
    try {
      const savedHistory = localStorage.getItem("grammar_wizard_quiz_history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to parse local history:", e);
    }

    // Shuffle and pick 2 unique presets from pool
    const shuffled = [...PRESET_POOL].sort(() => 0.5 - Math.random());
    setPresets(shuffled.slice(0, 2));

    // Automatically default to input screen, utilizing the free server-side key
    setScreen("input");
  }, []);

  // Save Key
  const handleSaveKey = () => {
    const keyToSave = apiKey.trim();
    if (keyToSave) {
      localStorage.setItem("secure_pref_gemini_api_key", keyToSave);
    } else {
      localStorage.removeItem("secure_pref_gemini_api_key");
    }
    setErrorMsg(null);
    setScreen("input");
  };

  // Delete key / Re-configure
  const handleResetKey = () => {
    setScreen("setup");
  };

  // Submit Login/Signup Form
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Please fill in both email and password fields.");
      setAuthLoading(false);
      return;
    }

    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
      // Reset values & close
      setAuthEmail("");
      setAuthPassword("");
      setShowAuthModal(false);
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "Authentication failed.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "Email address is already in use.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out user
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Fallback to local storage history on sign out
      const savedHistoryStr = localStorage.getItem("grammar_wizard_quiz_history") || "[]";
      let localHist: QuizHistoryItem[] = [];
      try {
        localHist = JSON.parse(savedHistoryStr);
      } catch (_) {}
      setHistory(localHist);
    } catch (err) {
      console.error("Signout error:", err);
    }
  };

  // File selection handler
  const handleFileSelected = (file: File) => {
    setErrorMsg(null);
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds 10MB limit. Please upload a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Strip out the metadata prefix to get pure base64 string
        const base64Data = result.split(",")[1];
        setUploadedFile({
          data: base64Data,
          mimeType: file.type || "application/octet-stream",
          name: file.name
        });
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  // CSV Exporter
  const handleExportCSV = (questions: QuizQuestion[], title: string) => {
    if (!questions || questions.length === 0) return;
    
    // Format the CSV content: Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation
    const headers = ["Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer Index", "Correct Option Letter", "Correct Option Text", "Explanation"];
    
    const rows = questions.map((q) => {
      const optLetter = q.correct_answer === 0 ? "A" : q.correct_answer === 1 ? "B" : q.correct_answer === 2 ? "C" : q.correct_answer === 3 ? "D" : "";
      const correctOptText = q.options[q.correct_answer] || "";
      
      // Escape double quotes and commas
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
      
      return [
        escape(q.question),
        escape(q.options[0] || ""),
        escape(q.options[1] || ""),
        escape(q.options[2] || ""),
        escape(q.options[3] || ""),
        q.correct_answer,
        escape(optLetter),
        escape(correctOptText),
        escape(q.explanation || "")
      ];
    });
    
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
    link.setAttribute("href", url);
    link.setAttribute("download", `grammar_wizard_quiz_${sanitizedTitle || "quiz"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Exporter
  const handleSavePDF = (questions: QuizQuestion[], textTitle: string, score: number, diffLevel: string) => {
    if (!questions || questions.length === 0) return;
    
    const doc = new jsPDF();
    let y = 15;
    
    const writeText = (text: string, style: { size?: number; color?: [number, number, number]; fontStyle?: string; spaceBelow?: number }) => {
      doc.setFontSize(style.size || 10);
      const fs = (style.fontStyle || "normal") as "normal" | "bold" | "italic" | "bolditalic";
      doc.setFont("helvetica", fs);
      if (style.color) {
        doc.setTextColor(style.color[0], style.color[1], style.color[2]);
      } else {
        doc.setTextColor(51, 65, 85); // Slate 700
      }
      const lines = doc.splitTextToSize(text, 180);
      lines.forEach((line: string) => {
        if (y > 275) {
          doc.addPage();
          y = 15;
        }
        doc.text(line, 15, y);
        y += (style.size || 10) * 0.45 + 2;
      });
      y += style.spaceBelow || 2;
    };

    // Header Title
    writeText("Grammar Wizard MCQ Quiz Report", { size: 18, fontStyle: "bold", color: [79, 70, 229], spaceBelow: 4 });
    writeText(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { size: 8, color: [148, 163, 184], spaceBelow: 8 });
    
    // Summary Box
    writeText(`Quiz Context: ${textTitle.slice(0, 100)}${textTitle.length > 100 ? "..." : ""}`, { size: 10, fontStyle: "italic", spaceBelow: 2 });
    writeText(`Difficulty: ${diffLevel}  |  Score Achieved: ${score} / ${questions.length}`, { size: 12, fontStyle: "bold", color: [30, 41, 59], spaceBelow: 10 });
    
    // Divider
    if (y > 280) { doc.addPage(); y = 15; }
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y, 195, y);
    y += 10;

    questions.forEach((q, idx) => {
      // Print Question
      writeText(`${idx + 1}. ${q.question}`, { size: 11, fontStyle: "bold", color: [15, 23, 42], spaceBelow: 3 });
      
      // Print Options
      q.options.forEach((opt, optIdx) => {
        const isCorrect = optIdx === q.correct_answer;
        const letter = optIdx === 0 ? "A" : optIdx === 1 ? "B" : optIdx === 2 ? "C" : "D";
        
        if (isCorrect) {
          writeText(`  [X] ${letter}. ${opt}  (Correct Answer)`, { size: 9, fontStyle: "bold", color: [16, 185, 129], spaceBelow: 1.5 });
        } else {
          writeText(`  [ ] ${letter}. ${opt}`, { size: 9, color: [71, 85, 105], spaceBelow: 1.5 });
        }
      });
      y += 2;

      // Print Explanation
      if (q.explanation) {
        writeText(`Explanation: ${q.explanation}`, { size: 8.5, fontStyle: "italic", color: [100, 116, 139], spaceBelow: 6 });
      }
      y += 4;
    });

    // Add footers with "Made With Love By Haris" on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setDrawColor(226, 232, 240); // Slate 200 divider
      doc.line(15, 282, 195, 282);
      doc.text("Made With Love By Haris", 15, 288);
      const pageText = `Page ${i} of ${pageCount}`;
      doc.text(pageText, 195 - doc.getTextWidth(pageText), 288);
    }

    // Save File
    const sanitizedTitle = textTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
    doc.save(`grammar_wizard_quiz_${sanitizedTitle || "quiz"}.pdf`);
  };

  // Fetch / Generate Quiz from Server
  const handleBuildQuiz = async () => {
    const isTopic = inputMode === "topic";
    const isFile = inputMode === "file";
    
    let textToUse = "";
    if (isTopic) {
      textToUse = topicInput;
    } else if (isFile) {
      textToUse = uploadedFile ? uploadedFile.name : "";
    } else {
      textToUse = grammarText;
    }

    if (isFile && !uploadedFile) {
      setErrorMsg("Please upload a document or picture to build a quiz.");
      return;
    }

    if (!isFile && !textToUse.trim()) {
      setErrorMsg(isTopic ? "Please enter a topic first (e.g., Photosynthesis)." : "Please enter or paste grammar rules text first.");
      return;
    }

    setErrorMsg(null);
    setScreen("loading");

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToUse,
          file: isFile ? uploadedFile : null,
          userApiKey: apiKey,
          difficulty: difficulty,
          questionCount: questionCount,
          mode: inputMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate the quiz.");
      }

      if (data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0) {
        setQuizQuestions(data.quiz);
        setQuizState({
          currentQuestionIndex: 0,
          userAnswers: {},
          isSubmitted: false,
          score: 0,
        });
        setExpandedExplanations({});
        setLoadingExplanations({});
        setFetchedExplanations({});

        // Add this quiz to History
        const newId = Date.now().toString();
        const displayLabel = isTopic 
          ? "Topic: " + textToUse 
          : isFile 
          ? "File MCQ: " + textToUse 
          : textToUse;
        const newHistoryItem: QuizHistoryItem = {
          id: newId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
          grammarText: displayLabel,
          quizQuestions: data.quiz,
          score: null, // starts as not submitted yet
          difficulty: difficulty,
          questionCount: questionCount,
        };

        const updatedHistory = [newHistoryItem, ...history];
        setHistory(updatedHistory);
        localStorage.setItem("grammar_wizard_quiz_history", JSON.stringify(updatedHistory));
        setCurrentQuizId(newId);

        // Sync to cloud if user is signed in
        if (currentUser) {
          setDoc(doc(db, "users", currentUser.uid, "quizHistory", newId), newHistoryItem)
            .catch(e => console.error("Cloud save failed:", e));
        }

        setScreen("quiz");
      } else {
        throw new Error("Gemini returned invalid or empty quiz data. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Network error. Please check your API key or internet.");
      setScreen("input");
    }
  };

  // Practice Incorrect Questions (Mistakes) Handler
  const handlePracticeIncorrect = async () => {
    // Gather incorrect answers
    const incorrects = quizQuestions.map((q, idx) => {
      const userSel = quizState.userAnswers[idx];
      const correctSel = q.correct_answer;
      return {
        question: q.question,
        correct_answer_text: q.options[correctSel] || "",
        user_answer_text: q.options[userSel] || "",
      };
    }).filter((_, idx) => quizState.userAnswers[idx] !== quizQuestions[idx].correct_answer);

    if (incorrects.length === 0) return;

    setErrorMsg(null);
    setScreen("loading");

    try {
      const payloadText = JSON.stringify(incorrects);
      
      // Request a targeted practice quiz (at least 3 questions, max 15, matching mistake count * 2)
      const countToRequest = Math.min(Math.max(incorrects.length * 2, 3), 15);

      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: payloadText,
          userApiKey: apiKey,
          difficulty: difficulty,
          questionCount: countToRequest,
          mode: "practice_incorrect",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate the practice quiz.");
      }

      if (data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0) {
        setQuizQuestions(data.quiz);
        setQuizState({
          currentQuestionIndex: 0,
          userAnswers: {},
          isSubmitted: false,
          score: 0,
        });
        setExpandedExplanations({});
        setLoadingExplanations({});
        setFetchedExplanations({});

        // Add this practice quiz to history
        const newId = Date.now().toString();
        const displayLabel = `Mistake Review: ${incorrects.length} Errors`;
        const newHistoryItem: QuizHistoryItem = {
          id: newId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
          grammarText: displayLabel,
          quizQuestions: data.quiz,
          score: null,
          difficulty: difficulty,
          questionCount: countToRequest,
        };

        const updatedHistory = [newHistoryItem, ...history];
        setHistory(updatedHistory);
        localStorage.setItem("grammar_wizard_quiz_history", JSON.stringify(updatedHistory));
        setCurrentQuizId(newId);

        // Sync to cloud if user is signed in
        if (currentUser) {
          setDoc(doc(db, "users", currentUser.uid, "quizHistory", newId), newHistoryItem)
            .catch(e => console.error("Cloud save failed:", e));
        }

        setScreen("quiz");
      } else {
        throw new Error("No practice questions returned.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while generating the practice quiz.");
      setScreen("results"); // fall back to results if failed
    }
  };

  // Select a quiz from history
  const handleSelectHistoryItem = (item: QuizHistoryItem) => {
    setQuizQuestions(item.quizQuestions);
    setGrammarText(item.grammarText);
    if (item.difficulty) {
      setDifficulty(item.difficulty);
    }
    if (item.questionCount) {
      setQuestionCount(item.questionCount);
    } else {
      setQuestionCount(item.quizQuestions?.length || 10);
    }
    setQuizState({
      currentQuestionIndex: 0,
      userAnswers: {},
      isSubmitted: item.score !== null,
      score: item.score || 0,
    });
    setExpandedExplanations({});
    setLoadingExplanations({});
    setFetchedExplanations({});
    setCurrentQuizId(item.id);
    
    if (item.score !== null) {
      setScreen("results");
    } else {
      setScreen("quiz");
    }
  };

  // Delete specific history item
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem("grammar_wizard_quiz_history", JSON.stringify(updated));

    // Delete from cloud if user is signed in
    if (currentUser) {
      deleteDoc(doc(db, "users", currentUser.uid, "quizHistory", id))
        .catch(e => console.error("Cloud delete failed:", e));
    }
  };

  // Toggle / Fetch Explanation
  const handleToggleExplanation = async (questionIndex: number, questionObj: QuizQuestion) => {
    if (expandedExplanations[questionIndex]) {
      setExpandedExplanations(prev => ({ ...prev, [questionIndex]: false }));
      return;
    }

    setExpandedExplanations(prev => ({ ...prev, [questionIndex]: true }));

    if (questionObj.explanation) {
      return;
    }

    if (fetchedExplanations[questionIndex]) {
      return;
    }

    setLoadingExplanations(prev => ({ ...prev, [questionIndex]: true }));
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questionObj.question,
          options: questionObj.options,
          correct_answer: questionObj.correct_answer,
          userApiKey: apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch explanation.");
      }

      setFetchedExplanations(prev => ({
        ...prev,
        [questionIndex]: data.explanation || "No explanation provided.",
      }));
    } catch (err: any) {
      console.error(err);
      setFetchedExplanations(prev => ({
        ...prev,
        [questionIndex]: `Could not fetch explanation: ${err.message || "Unknown error"}. Please ensure your API key is valid.`,
      }));
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [questionIndex]: false }));
    }
  };

  // Web Audio API Sound Feedback
  const playSound = async (type: "correct" | "incorrect") => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // CRITICAL: Always resume the audio context. Inside iframes, browsers suspend audio contexts automatically.
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      
      if (type === "correct") {
        const now = ctx.currentTime;
        // High upbeat double note
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, now); // C5
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.15, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, now + 0.07); // E5
        gain2.gain.setValueAtTime(0, now + 0.07);
        gain2.gain.linearRampToValueAtTime(0.15, now + 0.09);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.3);
      } else {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.22);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (err) {
      console.warn("Web Audio API not supported or suspended:", err);
    }
  };

  // Option select
  const handleSelectOption = (optionIndex: number) => {
    if (quizState.isSubmitted) return; // Prevent changing answers after quiz submission
    
    const alreadyAnswered = quizState.userAnswers[quizState.currentQuestionIndex] !== undefined;
    if (alreadyAnswered) return; // Prevent changing chosen option once selected

    const qObj = quizQuestions[quizState.currentQuestionIndex];
    let isCorrect = false;
    if (qObj) {
      isCorrect = optionIndex === qObj.correct_answer;
      playSound(isCorrect ? "correct" : "incorrect");
    }

    setQuizState(prev => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [prev.currentQuestionIndex]: optionIndex,
      }
    }));

    if (!alreadyAnswered) {
      if (isCorrect) {
        setXp(p => {
          const next = p + 15;
          const prevLvl = Math.floor(p / 100) + 1;
          const nextLvl = Math.floor(next / 100) + 1;
          if (nextLvl > prevLvl) {
            triggerXpFeedback(`⚡ Level Up! Level ${nextLvl}`);
          } else {
            triggerXpFeedback("+15 XP Correct!");
          }
          return next;
        });
      }
    }
  };

  // Quiz submission
  const handleSubmitQuiz = () => {
    let scoreCount = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizState.userAnswers[idx] === q.correct_answer) {
        scoreCount++;
      }
    });

    setQuizState(prev => ({
      ...prev,
      isSubmitted: true,
      score: scoreCount,
    }));

    // Major completion XP
    const bonusXp = 50 + scoreCount * 10;
    setXp(p => {
      const next = p + bonusXp;
      const prevLvl = Math.floor(p / 100) + 1;
      const nextLvl = Math.floor(next / 100) + 1;
      if (nextLvl > prevLvl) {
        triggerXpFeedback(`🌟 LEVEL UP! Level ${nextLvl}`);
      } else {
        triggerXpFeedback(`+${bonusXp} XP Completed!`);
      }
      return next;
    });

    // Check and update daily streak once per calendar day
    try {
      const todayStr = new Date().toLocaleDateString("en-CA");
      const lastCompletedDate = localStorage.getItem("grammar_wizard_last_completed_date");
      
      if (lastCompletedDate !== todayStr) {
        if (lastCompletedDate) {
          const d1 = new Date(lastCompletedDate);
          const d2 = new Date(todayStr);
          const diffTime = d2.getTime() - d1.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            setStreak(p => p + 1);
          } else {
            setStreak(1);
          }
        } else {
          setStreak(1);
        }
        localStorage.setItem("grammar_wizard_last_completed_date", todayStr);
      }
    } catch (e) {
      console.error("Streak calculation error:", e);
      setStreak(p => p + 1); // fallback
    }
    triggerMotivationalQuote();

    // Save score in history item
    if (currentQuizId) {
      const updatedHistory = history.map(item => {
        if (item.id === currentQuizId) {
          const updatedItem = { ...item, score: scoreCount };
          // Sync to cloud if user is signed in
          if (currentUser) {
            setDoc(doc(db, "users", currentUser.uid, "quizHistory", item.id), updatedItem)
              .catch(e => console.error("Cloud score update failed:", e));
          }
          return updatedItem;
        }
        return item;
      });
      setHistory(updatedHistory);
      localStorage.setItem("grammar_wizard_quiz_history", JSON.stringify(updatedHistory));
    }

    setScreen("results");
  };

  const currentQ = quizQuestions[quizState.currentQuestionIndex];
  const isLastQuestion = quizState.currentQuestionIndex === quizQuestions.length - 1;

  // Render Screens
  return (
    <div id="phone-container" className="flex flex-col items-center justify-center p-4">
      {/* Device frame */}
      <div id="phone-frame" className="relative w-[360px] h-[720px] bg-slate-900 rounded-[40px] shadow-2xl border-8 border-slate-800 flex flex-col overflow-hidden text-slate-800">
        
        {/* Notch / Speaker */}
        <div id="phone-notch" className="absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-32 bg-slate-800 rounded-b-xl z-50 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
        </div>

        {/* Status Bar */}
        <div id="phone-statusbar" className="h-7 pt-2 px-6 flex justify-between items-center text-[10px] font-mono tracking-tight text-slate-500 bg-slate-100/90 border-b border-slate-200/40 select-none">
          <span>09:41 AM</span>
          <div className="flex items-center gap-1">
            <span>5G</span>
            <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-500 rounded-xs"></div>
            </div>
          </div>
        </div>

        {/* App Screen Canvas (Professional Polish Light theme) */}
        <div id="app-canvas" className="flex-1 bg-slate-50 flex flex-col overflow-hidden relative">
          
          {/* Main App TopBar */}
          <div id="app-topbar" className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between select-none shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-indigo-100 shadow-md">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              </div>
              <span className="font-bold text-xs tracking-tight text-slate-800">Grammar Wizard</span>
            </div>
            
            {screen !== "setup" && (
              <div className="flex items-center gap-1.5">
                <button 
                  id="btn-toggle-settings-menu"
                  type="button"
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-center relative active:scale-95 cursor-pointer ${
                    showSettingsMenu
                      ? "text-indigo-600 bg-indigo-50 border-indigo-200 shadow-xs"
                      : "text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                  title="Open Settings Hub"
                >
                  <MoreVertical className="w-4 h-4 text-slate-600" />
                  <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Gamified Status Subbar */}
          {screen !== "setup" && (
            <div className="bg-slate-100/60 border-b border-slate-200 p-2.5 flex items-center justify-between gap-3 text-slate-800 select-none shrink-0 font-sans shadow-2xs relative">
              {/* Floating XP Feedbacks */}
              <div className="absolute top-1 left-4 z-40 pointer-events-none flex flex-col gap-1">
                <AnimatePresence>
                  {xpFeedbacks.map((f) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: -8, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-indigo-400"
                    >
                      <Zap className="w-2.5 h-2.5 fill-amber-300 stroke-amber-300" />
                      <span>{f.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Level progress info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[9px] font-extrabold text-indigo-700 uppercase tracking-wider mb-1">
                  <span className="truncate flex items-center gap-1">
                    <Award className="w-3 h-3 text-indigo-600 animate-bounce" />
                    <span>Lvl {currentLevel} | {getLevelTitle(currentLevel)}</span>
                  </span>
                  <span>{levelProgress}/100 XP</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300/30">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                  />
                </div>
              </div>

              {/* Streak and Spark Trigger */}
              <div className="flex items-center gap-2 shrink-0">
                <div 
                  className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-xl text-[10px] font-black shadow-3xs hover:scale-105 transition-all"
                  title="Your daily practice streak!"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
                  <span>{streak}d</span>
                </div>

                <button
                  type="button"
                  onClick={triggerMotivationalQuote}
                  className="flex items-center justify-center p-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-600 hover:text-indigo-700 rounded-xl transition-all shadow-3xs cursor-pointer active:scale-95"
                  title="Click to spark motivational wisdom!"
                >
                  <Lightbulb className="w-4 h-4 text-indigo-500 fill-amber-100 animate-pulse" />
                </button>
              </div>
            </div>
          )}

          {/* Sliding Settings Hub Dropdown Drawer */}
          <AnimatePresence>
            {showSettingsMenu && (
              <>
                {/* Overlay backdrop */}
                <div 
                  className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] z-40 transition-opacity"
                  onClick={() => setShowSettingsMenu(false)}
                />
                
                {/* Interactive Settings Card */}
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                  className="absolute top-14 right-3 left-3 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-50 p-4 select-none flex flex-col gap-3.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-indigo-600 animate-spin-slow" />
                      <span>Wizard Settings Hub</span>
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowSettingsMenu(false)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Difficulty Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold tracking-wider uppercase text-slate-400 block">
                      Quiz Difficulty
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                      {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => {
                        const isSelected = difficulty === lvl;
                        let colorClasses = "";
                        if (lvl === "Beginner") {
                          colorClasses = isSelected 
                            ? "bg-emerald-600 text-white shadow-xs" 
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
                        } else if (lvl === "Intermediate") {
                          colorClasses = isSelected 
                            ? "bg-indigo-600 text-white shadow-xs" 
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
                        } else {
                          colorClasses = isSelected 
                            ? "bg-rose-600 text-white shadow-xs" 
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
                        }
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setDifficulty(lvl)}
                            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all text-center select-none cursor-pointer ${colorClasses}`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Number of questions selector */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold tracking-wider uppercase text-slate-400">Number of MCQs</span>
                      <span className="text-[10px] text-slate-500 font-medium">Configure length (3-30)</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuestionCount(prev => Math.max(3, prev - 1))}
                        className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-lg flex items-center justify-center text-xs transition-colors border border-slate-200 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-800">{questionCount}</span>
                      <button
                        type="button"
                        onClick={() => setQuestionCount(prev => Math.min(30, prev + 1))}
                        className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-lg flex items-center justify-center text-xs transition-colors border border-slate-200 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 my-0.5" />

                  {/* Audio effects, cloud sync and API reset options */}
                  <div className="flex flex-col gap-2.5">
                    {/* Sound FX row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                        {soundEnabled ? (
                          <Volume2 className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        ) : (
                          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>Sound Feedback FX</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          soundEnabled ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                      >
                        <div 
                          className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                            soundEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Cloud synchronization row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                        {currentUser ? (
                          <Cloud className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        ) : (
                          <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>Cloud History Sync</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSettingsMenu(false);
                          setAuthError(null);
                          setShowAuthModal(true);
                        }}
                        className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${
                          currentUser 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" 
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {currentUser ? "Manage Account" : "Set up Backup"}
                      </button>
                    </div>

                    {/* Developer key row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Developer Key</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSettingsMenu(false);
                          handleResetKey();
                        }}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-[9px] font-bold transition-all cursor-pointer"
                      >
                        Configure Key
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Authentic Mobile Auth Drawer / Slide-up Overlay */}
          <AnimatePresence>
            {showAuthModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end justify-center"
                onClick={() => setShowAuthModal(false)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="w-full bg-white rounded-t-[32px] p-5 shadow-2xl flex flex-col max-h-[90%] border-t border-slate-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Pull handle bar */}
                  <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4 shrink-0"></div>

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {currentUser ? "My Sync Profile" : isSignUpMode ? "Create Account" : "Sign In to Backup"}
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        {currentUser ? "Your history is securely synced to the cloud." : "Never lose your history across devices!"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(false)}
                      className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body Contents */}
                  <div className="flex-1 overflow-y-auto pr-0.5">
                    {currentUser ? (
                      /* Authenticated state panel */
                      <div className="space-y-4 py-2">
                        <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-100 shrink-0">
                            <Cloud className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-mono text-emerald-800 font-bold uppercase tracking-wider">Cloud Connected</p>
                            <p className="text-xs font-semibold text-slate-800 truncate">{currentUser.email}</p>
                          </div>
                        </div>

                        {syncingWithCloud && (
                          <div className="flex items-center justify-center gap-2 py-1.5 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                            <span className="text-[11px] font-medium">Syncing history list...</span>
                          </div>
                        )}

                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/50 text-[11px] text-slate-600 leading-relaxed font-medium">
                          <p className="font-bold text-slate-700 mb-1">How sync works:</p>
                          We back up and synchronize all your local grammar quiz items and final test scores under your unique email. Simply log in on any device or phone to continue!
                        </div>

                        <button
                          type="button"
                          id="btn-auth-logout"
                          onClick={() => {
                            handleSignOut();
                            setShowAuthModal(false);
                          }}
                          className="w-full bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200 hover:border-red-200 transition-all flex items-center justify-center gap-2 mt-4 select-none"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    ) : (
                      /* Form panel (Login / Signup) */
                      <form onSubmit={handleAuthAction} className="space-y-3 py-1">
                        {authError && (
                          <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-[11px] rounded-xl flex items-center gap-2 shadow-2xs">
                            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                            <span className="font-medium leading-normal">{authError}</span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-wider uppercase text-slate-400 block">Email Address</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            <input
                              type="email"
                              required
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-slate-800 font-sans transition-colors"
                              placeholder="you@example.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-wider uppercase text-slate-400 block">Password</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            <input
                              type="password"
                              required
                              minLength={6}
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-slate-800 font-mono transition-colors"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 mt-4 select-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {authLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : isSignUpMode ? (
                            <>
                              <span>Create Account & Sync</span>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            </>
                          ) : (
                            <>
                              <span>Sign In & Load History</span>
                              <LogIn className="w-3.5 h-3.5 text-indigo-200" />
                            </>
                          )}
                        </button>

                        <div className="text-center pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSignUpMode(!isSignUpMode);
                              setAuthError(null);
                            }}
                            className="text-[10px] text-indigo-600 hover:text-indigo-700 hover:underline font-semibold font-sans"
                          >
                            {isSignUpMode ? "Already have an account? Sign In" : "Don't have an account yet? Sign Up"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Body */}
          <div id="app-body" className="flex-1 overflow-y-auto p-4 flex flex-col">
            <AnimatePresence mode="wait">
              
              {/* Screen 1: Setup Key */}
              {screen === "setup" && (
                <motion.div 
                  key="setup-screen"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="flex-1 flex flex-col justify-center py-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-indigo-100 shadow-sm shadow-indigo-100">
                      <Key className="w-6 h-6 text-indigo-600" />
                    </div>
                    
                    <h2 className="text-base font-bold text-slate-800 text-center mb-1.5">Setup API Key (Optional)</h2>
                    <p className="text-[11px] text-slate-500 text-center px-2 leading-relaxed mb-6">
                      Entering a custom Google Gemini API Key is entirely optional. If left blank, Grammar Wizard will use the built-in, free Gemini API Key!
                    </p>

                    {errorMsg && (
                      <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl mb-4 flex items-center gap-2 shadow-xs">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                        <span className="font-medium">{errorMsg}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold tracking-wider uppercase text-slate-400 block">Google Gemini API Key</label>
                      <input 
                        id="input-setup-api-key"
                        type="password"
                        placeholder="Paste your API key here (AIzaSy...)"
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setErrorMsg(null);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-slate-800 font-mono placeholder-slate-400 transition-colors shadow-xs"
                      />
                    </div>
                  </div>

                  <button 
                    id="btn-save-launch"
                    onClick={handleSaveKey}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 mt-auto"
                  >
                    <span>{apiKey.trim() ? "Save Key & Launch" : "Continue with Free Key"}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                </motion.div>
              )}

              {/* Screen 2: Input Screen */}
              {screen === "input" && (
                <motion.div 
                  key="input-screen"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex-1 flex flex-col h-full min-h-0"
                >
                  {/* Tab Switcher */}
                  <div id="tabs-container" className="flex bg-slate-100 p-1 rounded-xl mb-4 select-none shrink-0 border border-slate-200/50">
                    <button
                      id="tab-create"
                      onClick={() => setActiveTab("create")}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                        activeTab === "create"
                          ? "bg-white text-indigo-950 shadow-xs border border-slate-200/30"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Create Quiz</span>
                    </button>
                    <button
                      id="tab-history"
                      onClick={() => setActiveTab("history")}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                        activeTab === "history"
                          ? "bg-white text-indigo-950 shadow-xs border border-slate-200/30"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <History className="w-3.5 h-3.5 text-indigo-600" />
                      <span>History ({history.length})</span>
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl mb-4 flex items-center gap-2 shadow-xs shrink-0">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                      <span className="font-medium">{errorMsg}</span>
                    </div>
                  )}

                  {activeTab === "create" ? (
                    <div className="flex-1 flex flex-col min-h-0">
                      {/* Active Segmented Mode Selector */}
                      <div className="mb-3.5 shrink-0 select-none bg-indigo-50/50 p-1 rounded-xl flex border border-indigo-100">
                        {(["text", "topic", "file"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setInputMode(m);
                              setErrorMsg(null);
                            }}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all text-center ${
                              inputMode === m
                                ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                                : "text-slate-550 hover:text-slate-900"
                            }`}
                          >
                            {m === "text" ? "📝 Notes" : m === "topic" ? "🧪 Topic" : "📷 Upload"}
                          </button>
                        ))}
                      </div>

                      {inputMode === "text" && (
                        <>
                          <div className="mb-3 shrink-0">
                            <h3 className="text-xs font-bold text-slate-800 mb-0.5">Grammar Copy-Paste Mode</h3>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Paste any grammar rules, lesson, or study notes. The Quiz Wizard will formulate custom MCQs.
                            </p>
                          </div>

                          <div className="flex-1 flex flex-col mb-3 min-h-0">
                            <div className="flex items-center justify-between mb-1 shrink-0">
                              <label className="text-[9px] font-bold tracking-wider uppercase text-slate-400 block">Lesson material / Study Guide</label>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const text = await navigator.clipboard.readText();
                                    if (text) {
                                      setGrammarText(text);
                                      setErrorMsg(null);
                                    }
                                  } catch (err) {
                                    console.warn("Clipboard read failed, please paste manually.", err);
                                  }
                                }}
                                className="text-[9px] text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/80 hover:bg-indigo-100 transition-all"
                              >
                                📋 Paste Clipboard
                              </button>
                            </div>
                            <textarea 
                              id="input-grammar-text"
                              placeholder="e.g., Passive Voice. We use passive voice to emphasize the target or recipient of an action. Formula: Subject + auxiliary verb + Past Participle..."
                              value={grammarText}
                              onChange={(e) => {
                                setGrammarText(e.target.value);
                                setErrorMsg(null);
                              }}
                              className="w-full flex-1 bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 placeholder-slate-400 resize-none leading-relaxed transition-colors overflow-y-auto shadow-xs"
                            />
                          </div>

                          
                        </>
                      )}

                      {inputMode === "topic" && (
                        <>
                          <div className="mb-3 shrink-0">
                            <h3 className="text-xs font-bold text-slate-800 mb-0.5">Custom Topic Mode</h3>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Type any subject or topic of your choice. The Wizard will conjur custom MCQs to test your knowledge.
                            </p>
                          </div>

                          <div className="flex-1 flex flex-col mb-3 min-h-0">
                            <label className="text-[9px] font-bold tracking-wider uppercase text-slate-400 mb-1 block">Enter Topic</label>
                            <div className="relative flex-1 flex flex-col">
                              <input 
                                id="input-custom-topic"
                                type="text"
                                placeholder="e.g., Photosynthesis, Black Holes, Ancient Egypt..."
                                value={topicInput}
                                onChange={(e) => {
                                  setTopicInput(e.target.value);
                                  setErrorMsg(null);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 placeholder-slate-400 transition-colors shadow-xs"
                              />
                              
                              
                            </div>
                          </div>
                        </>
                      )}

                      {inputMode === "file" && (
                        <div className="flex-1 flex flex-col mb-3 min-h-0">
                          <div className="mb-3 shrink-0">
                            <h3 className="text-xs font-bold text-slate-800 mb-0.5">Upload Pic or Documents</h3>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Upload any document (PDF, TXT) or picture (PNG, JPG, WEBP). The Wizard will generate MCQs based on its contents.
                            </p>
                          </div>

                          {/* Drag & Drop Area */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOver(false);
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleFileSelected(e.dataTransfer.files[0]);
                              }
                            }}
                            onClick={() => document.getElementById("file-upload-input")?.click()}
                            className={`flex-1 min-h-[140px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                              dragOver
                                ? "border-indigo-500 bg-indigo-50/50"
                                : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/50"
                            }`}
                          >
                            <input
                              type="file"
                              id="file-upload-input"
                              accept=".pdf,.txt,image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileSelected(e.target.files[0]);
                                }
                              }}
                            />
                            
                            {!uploadedFile ? (
                              <div className="space-y-2 select-none">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto">
                                  <Cloud className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-slate-700">Drag & Drop or Click to Upload</p>
                                  <p className="text-[9px] text-slate-400 mt-0.5">PDF, TXT, PNG, JPG, or WEBP (max 10MB)</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3 w-full">
                                <div className="flex items-center gap-2 bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100/60 max-w-full text-left">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm font-mono text-[9px] font-bold">
                                    {uploadedFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold text-slate-800 truncate">{uploadedFile.name}</p>
                                    <p className="text-[9px] text-slate-400 uppercase tracking-wide font-mono">{uploadedFile.mimeType}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUploadedFile(null);
                                    }}
                                    className="p-1.5 hover:bg-indigo-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors shrink-0"
                                    title="Remove file"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> File loaded successfully!
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Active level status & configuration summary badge */}
                      <div className="mb-4 shrink-0 p-2.5 bg-indigo-50/50 border border-indigo-100/70 rounded-2xl flex items-center justify-between text-slate-800 text-[10px] select-none font-sans">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                          <span>Current Config: <strong className="text-indigo-700">{difficulty}</strong> • <strong className="text-indigo-700">{questionCount} Qs</strong></span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSettingsMenu(true)}
                          className="text-[9px] text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2 py-0.5 rounded-lg font-extrabold border border-indigo-200 transition-all cursor-pointer"
                        >
                          Change
                        </button>
                      </div>

                      <button 
                        id="btn-build-quiz"
                        onClick={handleBuildQuiz}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 shrink-0 mt-auto animate-fadeIn"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>{inputMode === "topic" ? "Generate Topic Quiz" : "Build Grammar Quiz"}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="mb-3 shrink-0 flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-800">Saved Quizzes & Lessons</h3>
                          <p className="text-[10px] text-slate-500">
                            Review your past quiz scores or re-take generated grammar lessons.
                          </p>
                        </div>
                        {history.length > 0 && (
                          <button
                            id="btn-clear-history"
                            onClick={() => {
                              if (window.confirm("Clear all quiz history?")) {
                                setHistory([]);
                                localStorage.removeItem("grammar_wizard_quiz_history");
                              }
                            }}
                            className="text-[9px] text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md font-bold transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {history.length === 0 ? (
                          <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-200/50">
                              <History className="w-6 h-6" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-700 mb-1">No history yet</h4>
                            <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
                              Paste some grammar rules on the "Create Quiz" tab to get started!
                            </p>
                          </div>
                        ) : (
                          history.map((item) => (
                            <div
                              key={item.id}
                              id={`history-item-${item.id}`}
                              onClick={() => handleSelectHistoryItem(item)}
                              className="bg-white hover:bg-slate-50/50 p-3 rounded-xl border border-slate-200 shadow-xs cursor-pointer transition-all flex items-start gap-2.5 relative group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  <span className="text-[9px] text-slate-400 font-mono font-medium flex items-center gap-0.5">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    {item.timestamp}
                                  </span>
                                  {item.score !== null ? (
                                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md border border-emerald-100 shrink-0">
                                      Score: {item.score}/{item.quizQuestions?.length || 10}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded-md border border-amber-100 shrink-0">
                                      Incomplete
                                    </span>
                                  )}
                                  {item.difficulty && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                                      item.difficulty === "Beginner"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : item.difficulty === "Intermediate"
                                        ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                        : "bg-rose-50 text-rose-700 border-rose-100"
                                    }`}>
                                      {item.difficulty}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-semibold text-slate-700 line-clamp-2 leading-relaxed">
                                  {item.grammarText}
                                </p>
                              </div>
                              <button
                                id={`btn-delete-history-${item.id}`}
                                onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                                className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete from history"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Screen 3: Loading Screen */}
              {screen === "loading" && (
                <motion.div 
                  key="loading-screen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-6"
                >
                  <div className="relative mb-6">
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping"></div>
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 mb-2 tracking-wide uppercase font-mono">Conjuring MCQ Quiz...</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-[240px]">
                    The Grammar Wizard is reading your lesson text and crafting {questionCount} custom grammar questions. This takes a moment.
                  </p>
                </motion.div>
              )}

              {/* Screen 4: Quiz Active Screen */}
              {screen === "quiz" && currentQ && (
                <motion.div 
                  key="quiz-screen"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col justify-between overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto pr-1 pb-2">
                    {/* Progress details */}
                    <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 mb-2">
                      <span className="text-indigo-600 font-bold">QUESTION {quizState.currentQuestionIndex + 1} OF {quizQuestions.length}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          id="btn-quiz-export-csv"
                          onClick={() => handleExportCSV(quizQuestions, inputMode === "file" ? (uploadedFile ? uploadedFile.name : "file") : (inputMode === "topic" ? topicInput : grammarText))}
                          className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors"
                          title="Download current questions as CSV"
                        >
                          📥 CSV
                        </button>
                        <span>{Math.round(((quizState.currentQuestionIndex + 1) / quizQuestions.length) * 100)}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden mb-5">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${((quizState.currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                      ></div>
                    </div>

                    {/* Question Statement */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-4">
                      <p className="text-xs font-bold text-slate-800 leading-relaxed">
                        {currentQ.question}
                      </p>
                    </div>

                    {/* Options (Radio Group Mockup) */}
                    <div className="space-y-2.5">
                      {currentQ.options.map((option, idx) => {
                        const isSelected = quizState.userAnswers[quizState.currentQuestionIndex] === idx;
                        const isCorrect = idx === currentQ.correct_answer;
                        
                        let optionStyles = "bg-white hover:bg-slate-50 border-slate-100 text-slate-750 hover:text-slate-900";
                        let radioStyles = "border-slate-300";
                        
                        if (isSelected) {
                          if (isCorrect) {
                            optionStyles = "bg-emerald-50/60 border-emerald-500 text-emerald-950 shadow-xs";
                            radioStyles = "border-emerald-500 bg-emerald-500";
                          } else {
                            optionStyles = "bg-rose-50/60 border-rose-500 text-rose-950 shadow-xs";
                            radioStyles = "border-rose-500 bg-rose-500";
                          }
                        }

                        return (
                          <div 
                            key={idx}
                            id={`option-${idx}`}
                            onClick={() => handleSelectOption(idx)}
                            className={`w-full p-3.5 rounded-xl border-2 transition-all duration-150 cursor-pointer flex items-start gap-3 select-none text-left ${optionStyles}`}
                          >
                            <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center mt-0.5 ${radioStyles}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                            </div>
                            <span className={`text-xs leading-normal font-sans ${isSelected ? 'font-semibold' : 'font-medium'}`}>{option}</span>
                            {isSelected && (
                              <span className="ml-auto shrink-0 self-center">
                                {isCorrect ? (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">Correct</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded-md">Incorrect</span>
                                )}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Show Explanation Toggle */}
                    <div className="mt-4">
                      <button
                        type="button"
                        id={`btn-toggle-explain-${quizState.currentQuestionIndex}`}
                        onClick={() => handleToggleExplanation(quizState.currentQuestionIndex, currentQ)}
                        className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100/85 text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs select-none"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{expandedExplanations[quizState.currentQuestionIndex] ? "Hide Explanation" : "Show Explanation"}</span>
                      </button>

                      {expandedExplanations[quizState.currentQuestionIndex] && (
                        <div className="mt-2.5 p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100/80 animate-fadeIn">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="text-[10px] font-bold text-indigo-700 tracking-wider uppercase">Grammar Wizard Explanation</span>
                          </div>
                          {loadingExplanations[quizState.currentQuestionIndex] ? (
                            <div className="flex items-center gap-2 py-2">
                              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                              <span className="text-[11px] text-slate-500 font-medium">Consulting grammar scroll...</span>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-600 leading-relaxed font-sans font-medium">
                              {currentQ.explanation || fetchedExplanations[quizState.currentQuestionIndex] || "No explanation provided."}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div className="flex items-center gap-3 mt-6 shrink-0 pt-3 border-t border-slate-200">
                    <button 
                      id="btn-prev-question"
                      onClick={() => setQuizState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 }))}
                      disabled={quizState.currentQuestionIndex === 0}
                      className="flex-1 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:pointer-events-none rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </button>

                    {isLastQuestion ? (
                      <button 
                        id="btn-submit-answers"
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(quizState.userAnswers).length < quizQuestions.length}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Submit</span>
                      </button>
                    ) : (
                      <button 
                        id="btn-next-question"
                        onClick={() => setQuizState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }))}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Screen 5: Results Screen */}
              {screen === "results" && (
                <motion.div 
                  key="results-screen"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="flex-1 min-h-0 flex flex-col">
                    
                    {/* Score header card */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center mb-4 shadow-sm select-none shrink-0">
                      <span className="text-[9px] font-bold tracking-wider uppercase text-indigo-600">Grammar Wizard Score</span>
                      <h4 className="text-3xl font-black text-slate-800 my-1">{quizState.score} / {quizQuestions.length}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {(() => {
                          const pct = (quizState.score / (quizQuestions.length || 10)) * 100;
                          if (pct >= 90) return "Exceptional! True Mastery! 🧙‍♂️";
                          if (pct >= 70) return "Great job! Very proficient! 🌟";
                          if (pct >= 50) return "Not bad, keep practicing! 📖";
                          return "Needs improvement. Try again! 🔎";
                        })()}
                      </p>
                    </div>

                    <h5 className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2 select-none">Review Answers</h5>
                    
                    {/* Detailed scrollable breakdown */}
                    <div id="results-breakdown" className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {quizQuestions.map((q, idx) => {
                        const userSel = quizState.userAnswers[idx];
                        const correctSel = q.correct_answer;
                        const isCorrect = userSel === correctSel;

                        return (
                          <div 
                            key={idx}
                            id={`review-item-${idx}`}
                            className={`p-3 rounded-xl border text-left ${
                              isCorrect 
                                ? "bg-emerald-50/50 border-emerald-150 text-emerald-950" 
                                : "bg-red-50/50 border-red-150 text-red-950"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-[11px] font-bold text-slate-800">
                                {idx + 1}. {q.question}
                              </span>
                              {isCorrect ? (
                                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                                  <Check className="w-3 h-3" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
                                  <X className="w-3 h-3" />
                                </div>
                              )}
                            </div>

                            {/* Show choices */}
                            <div className="space-y-1.5 pl-1">
                              {q.options.map((opt, optIdx) => {
                                const isUserSelected = userSel === optIdx;
                                const isCorrectChoice = correctSel === optIdx;

                                let choiceStyle = "text-slate-500 font-sans font-medium";
                                if (isCorrectChoice) {
                                  choiceStyle = "text-emerald-700 font-bold font-sans flex items-center gap-1";
                                } else if (isUserSelected) {
                                  choiceStyle = "text-red-700 font-bold line-through font-sans flex items-center gap-1";
                                }

                                return (
                                  <div key={optIdx} className="text-[11px] flex items-center gap-1">
                                    <span className={choiceStyle}>
                                      {optIdx === 0 ? "A" : optIdx === 1 ? "B" : optIdx === 2 ? "C" : "D"}. {opt}
                                      {isCorrectChoice && <Check className="w-3 h-3 inline text-emerald-600 shrink-0" />}
                                      {!isCorrectChoice && isUserSelected && <X className="w-3 h-3 inline text-red-600 shrink-0" />}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Toggle explanation in Results Review */}
                            <div className="mt-3 pt-2.5 border-t border-slate-100">
                              <button
                                type="button"
                                id={`btn-toggle-explain-results-${idx}`}
                                onClick={() => handleToggleExplanation(idx, q)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 text-[10px] font-bold transition-all shadow-2xs select-none"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>{expandedExplanations[idx] ? "Hide Explanation" : "Show Explanation"}</span>
                              </button>

                              {expandedExplanations[idx] && (
                                <div className="mt-2 p-2.5 bg-indigo-50/40 rounded-lg border border-indigo-100/60 animate-fadeIn text-[10px] font-medium text-slate-600 leading-relaxed">
                                  {loadingExplanations[idx] ? (
                                    <div className="flex items-center gap-1.5 py-1">
                                      <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                                      <span>Consulting grammar scroll...</span>
                                    </div>
                                  ) : (
                                    <span>{q.explanation || fetchedExplanations[idx] || "No explanation provided."}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Share & Save Panel */}
                  <div className="bg-slate-100/80 p-3 rounded-2xl border border-slate-200/50 my-3.5 space-y-2 select-none">
                    <p className="text-[9px] font-black tracking-wider uppercase text-slate-400 text-center">Export & Save Quiz Report</p>
                    <button
                      type="button"
                      id="btn-export-pdf"
                      onClick={() => handleSavePDF(quizQuestions, inputMode === "file" ? (uploadedFile ? uploadedFile.name : "file") : (inputMode === "topic" ? topicInput : grammarText), quizState.score, difficulty)}
                      className="w-full py-2.5 px-3 bg-white hover:bg-rose-50 border border-slate-200 text-rose-950 text-[10px] font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 border-dashed border-rose-200 hover:border-rose-400"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Save PDF Report</span>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-4 shrink-0 pt-3 border-t border-slate-200">
                    <button 
                      id="btn-new-quiz"
                      onClick={() => setScreen("input")}
                      className={`${
                        quizState.score < quizQuestions.length ? "flex-1" : "w-full"
                      } py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-1.5`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>New Quiz</span>
                    </button>
                    {quizState.score < quizQuestions.length && (
                      <button 
                        id="btn-practice-incorrect"
                        onClick={handlePracticeIncorrect}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-100 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Practice Mistakes</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Floating Dynamic Motivational Quote Overlay */}
          <AnimatePresence>
            {showQuoteToast && activeQuote && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", damping: 18, stiffness: 180 }}
                onClick={() => setShowQuoteToast(false)}
                className="absolute bottom-12 left-3 right-3 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-indigo-500/40 shadow-xl z-50 flex flex-col gap-2 select-none cursor-pointer hover:bg-slate-950/95 transition-all overflow-hidden"
              >
                {/* Glowing border glow effect */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-amber-300 to-rose-500" />
                
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/80 text-white flex items-center justify-center shrink-0 shadow-inner">
                    <Lightbulb className="w-4 h-4 text-amber-300 fill-amber-300/30" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black tracking-wider uppercase text-indigo-400">Mindset Spark</p>
                    <p className="text-[11px] font-medium leading-relaxed text-slate-100 italic">
                      "{activeQuote}"
                    </p>
                    {activeAuthor && (
                      <p className="text-[9px] text-slate-400 text-right font-bold mt-1">
                        — {activeAuthor}
                      </p>
                    )}
                  </div>
                </div>

                {/* Animated Shrinking Timeline */}
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 4.5, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Bar / Soft Keys Mockup */}
          <div id="phone-navkeys" className="h-10 bg-slate-50 flex items-center justify-around text-slate-400 border-t border-slate-200 shrink-0 select-none">
            <div className="w-4 h-4 border-2 border-slate-300 rounded-sm"></div>
            <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
            <div className="w-4 h-4 flex items-center justify-center">
              <span className="text-xl font-bold font-mono tracking-tighter leading-none text-slate-400">&lt;</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
