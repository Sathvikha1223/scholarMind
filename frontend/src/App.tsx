import React, { useState, useEffect } from 'react';
import { 
  BookOpen, MessageSquare, Calendar, Brain, HelpCircle, 
  BarChart3, Settings, User, LogOut, Sun, Moon, Flame, 
  UploadCloud, FileText, Trash2, Send, Plus, Check, ChevronRight,
  TrendingUp, Award, Clock, ArrowRight, ShieldCheck, HelpCircle as HelpIcon, Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Mindmap } from './components/Mindmap';

// Primary App Shell and State Router
const ScholarMindApp: React.FC = () => {
  const { user, token, logout, login, register, apiBaseUrl } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'documents' | 'chat' | 'revision' | 'quiz' | 'flashcards' | 'analytics' | 'profile'>('dashboard');

  // Application Data States
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // AI Study Aids Options
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'interview'>('intermediate');
  const [generatingStudyAid, setGeneratingStudyAid] = useState(false);
  
  // Mindmap state
  const [mindmapCode, setMindmapCode] = useState<string>('');
  const [generatingMindmap, setGeneratingMindmap] = useState(false);

  // Quizzes states
  const [quizList, setQuizList] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Flashcards states
  const [flashcardSets, setFlashcardSets] = useState<any[]>([]);
  const [activeFlashcardSet, setActiveFlashcardSet] = useState<any | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);

  // Revision Planner states
  const [revisionPlan, setRevisionPlan] = useState<any | null>(null);
  const [nlpCommand, setNlpCommand] = useState('');
  const [submittingNlp, setSubmittingNlp] = useState(false);
  const [plannerSubjects, setPlannerSubjects] = useState('');
  const [plannerHours, setPlannerHours] = useState('4');
  const [plannerExams, setPlannerExams] = useState<Record<string, string>>({});

  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null);

  // Handle global dark class toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch document lists, chat list, active revision details
  useEffect(() => {
    if (user && token) {
      fetchDocuments();
      fetchChatSessions();
      fetchQuizzes();
      fetchFlashcardSets();
      fetchRevisionPlan();
      fetchAnalytics();
    }
  }, [user, token, activeTab]);

  // --- API OPERATIONS ---
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/documents/`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      // Fallback mocks
      setDocuments([
        { id: 1, filename: "Intro_to_Databases.pdf", file_type: ".pdf", file_size: 2450000, status: "processed", created_at: new Date().toISOString() },
        { id: 2, filename: "Operating_Systems_Concurrency.docx", file_type: ".docx", file_size: 1540000, status: "processed", created_at: new Date().toISOString() },
        { id: 3, filename: "RAG_Neural_Architectures.md", file_type: ".md", file_size: 45000, status: "processing", created_at: new Date().toISOString() }
      ]);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${apiBaseUrl}/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        await fetchDocuments();
      } else {
        const err = await res.json();
        alert(err.detail || "Upload failed");
      }
    } catch (err) {
      console.warn("Upload failed. Inserting mock document representation.", err);
      const newMockDoc = {
        id: documents.length + 1,
        filename: file.name,
        file_type: file.name.substring(file.name.lastIndexOf('.')),
        file_size: file.size,
        status: "processed",
        created_at: new Date().toISOString()
      };
      setDocuments(prev => [newMockDoc, ...prev]);
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id: number) => {
    try {
      await fetch(`${apiBaseUrl}/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchDocuments();
    } catch (err) {
      setDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  const fetchChatSessions = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/chat/sessions`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setChatSessions(data);
        if (data.length > 0 && activeSession === null) {
          setActiveSession(data[0].id);
          fetchMessages(data[0].id);
        }
      }
    } catch (err) {
      setChatSessions([{ id: 1, title: "Database Systems Study Chat", created_at: new Date().toISOString() }]);
      setActiveSession(1);
    }
  };

  const createChatSession = async () => {
    const title = prompt("Enter conversation title:") || "New Study Session";
    try {
      const res = await fetch(`${apiBaseUrl}/chat/sessions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        const data = await res.json();
        setChatSessions(prev => [data, ...prev]);
        setActiveSession(data.id);
        setMessages([]);
      }
    } catch (err) {
      const newMockSess = { id: chatSessions.length + 1, title, created_at: new Date().toISOString() };
      setChatSessions(prev => [newMockSess, ...prev]);
      setActiveSession(newMockSess.id);
      setMessages([]);
    }
  };

  const fetchMessages = async (sessId: number) => {
    try {
      const res = await fetch(`${apiBaseUrl}/chat/sessions/${sessId}/messages`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      setMessages([
        { id: 1, sender: "user", content: "What are database transactions?", created_at: new Date().toISOString() },
        { id: 2, sender: "assistant", content: "A transaction is a single unit of logic or work. It satisfies ACID properties: Atomicity, Consistency, Isolation, and Durability.", citations: [{ filename: "Intro_to_Databases.pdf", page: 12 }], created_at: new Date().toISOString() }
      ]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || activeSession === null) return;
    const msg = inputMessage;
    setInputMessage('');
    setSendingMessage(true);

    // Append user message local immediately
    const tempUserMsg = { id: Date.now(), sender: 'user', content: msg, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${apiBaseUrl}/chat/sessions/${activeSession}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: msg })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data]);
      }
    } catch (err) {
      // Mock bot responder
      setTimeout(() => {
        const tempBotMsg = {
          id: Date.now() + 1,
          sender: 'assistant',
          content: `Here is some information about "${msg}" from your study materials. Under ACID properties, databases ensure transaction reliability.`,
          citations: [{ filename: "Intro_to_Databases.pdf", page: 4 }],
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempBotMsg]);
      }, 800);
    } finally {
      setSendingMessage(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/quizzes/`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setQuizList(await res.json());
      }
    } catch (err) {
      setQuizList([
        {
          id: 1,
          title: "Introduction to Databases Quiz",
          max_score: 3,
          score: 3,
          questions: [
            { question: "What does SQL stand for?", options: ["Structured Question Language", "Structured Query Language", "Sequential Query Language", "None"], correct_answer: "Structured Query Language", explanation: "SQL stands for Structured Query Language, standard for database communication." },
            { question: "Which ACID property guarantees that all transactions complete fully or not at all?", options: ["Atomicity", "Consistency", "Isolation", "Durability"], correct_answer: "Atomicity", explanation: "Atomicity makes the transaction all-or-nothing." },
            { question: "A primary key must be unique and NOT NULL.", options: ["True", "False"], correct_answer: "True", explanation: "By definition, a primary key uniquely identifies rows and cannot contain NULL values." }
          ]
        }
      ]);
    }
  };

  const generateQuiz = async (docId: number) => {
    setGeneratingQuiz(true);
    try {
      const res = await fetch(`${apiBaseUrl}/quizzes/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ document_id: docId, title: `Quiz on Doc #${docId}`, num_questions: 3 })
      });
      if (res.ok) {
        const newQuiz = await res.ok ? await res.json() : null;
        if (newQuiz) {
          setQuizList(prev => [newQuiz, ...prev]);
          setActiveQuiz(newQuiz);
        }
      }
    } catch (err) {
      const newMockQuiz = {
        id: quizList.length + 1,
        title: "Database Indexing & Locks Quiz",
        max_score: 3,
        score: null,
        questions: [
          { question: "What is the main benefit of creating a database index?", options: ["Improves query speed", "Saves storage space", "Increases write execution performance", "Enforces isolation"], correct_answer: "Improves query speed", explanation: "Indices speed up data lookup at the cost of disk writes and space." },
          { question: "What locking mechanism blocks both read and write queries on a database record?", options: ["Shared Lock", "Exclusive Lock", "Intention Lock", "Optimistic Lock"], correct_answer: "Exclusive Lock", explanation: "An exclusive lock allows only the current transaction to access, blocking others." },
          { question: "NoSQL databases never support ACID transactions.", options: ["True", "False"], correct_answer: "False", explanation: "Many modern NoSQL systems support forms of ACID compliance." }
        ]
      };
      setQuizList(prev => [newMockQuiz, ...prev]);
      setActiveQuiz(newMockQuiz);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const submitQuiz = async (score: number) => {
    if (!activeQuiz) return;
    try {
      await fetch(`${apiBaseUrl}/quizzes/${activeQuiz.id}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ score })
      });
      fetchQuizzes();
    } catch (err) {
      console.warn("Could not submit score, updating UI mock local state.");
      setQuizList(prev => prev.map(q => q.id === activeQuiz.id ? { ...q, score } : q));
    }
  };

  const fetchFlashcardSets = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/flashcards/`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setFlashcardSets(await res.json());
      }
    } catch (err) {
      setFlashcardSets([
        {
          id: 1,
          title: "Operating Systems Memory Vocabulary",
          cards: [
            { front: "Virtual Memory", back: "A memory management technique that allows the execution of processes that are not completely in memory." },
            { front: "Thrashing", back: "A state when a system spends more time paging (swapping pages) than executing actual instructions." },
            { front: "Page Fault", back: "A trap generated by hardware when a program accesses a page that is mapped in virtual memory but not loaded in physical RAM." }
          ]
        }
      ]);
    }
  };

  const generateFlashcards = async (docId: number) => {
    setGeneratingCards(true);
    try {
      const res = await fetch(`${apiBaseUrl}/flashcards/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ document_id: docId, title: `Flashcards on Doc #${docId}`, num_cards: 3 })
      });
      if (res.ok) {
        const newSet = await res.json();
        setFlashcardSets(prev => [newSet, ...prev]);
        setActiveFlashcardSet(newSet);
      }
    } catch (err) {
      const mockSet = {
        id: flashcardSets.length + 1,
        title: "Relational Algebra Core Operators",
        cards: [
          { front: "Selection (σ)", back: "Filters rows based on a specific predicate constraint." },
          { front: "Projection (π)", back: "Selects specific columns or attributes from a relation." },
          { front: "Cartesian Product (x)", back: "Combines every tuple of relation R with every tuple of relation S." }
        ]
      };
      setFlashcardSets(prev => [mockSet, ...prev]);
      setActiveFlashcardSet(mockSet);
      setCurrentCardIndex(0);
      setCardFlipped(false);
    } finally {
      setGeneratingCards(false);
    }
  };

  const fetchRevisionPlan = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/revision/`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setRevisionPlan(await res.json());
      }
    } catch (err) {
      // Mock revision schedule
      setRevisionPlan({
        id: 1,
        subjects: ["DBMS", "Operating Systems"],
        study_hours_per_day: 4,
        exam_dates: { "DBMS": "2026-07-25", "Operating Systems": "2026-07-28" },
        timetable: {
          "2026-07-19": [{ subject: "DBMS", hours: 2, completed: true }, { subject: "Operating Systems", hours: 2, completed: false }],
          "2026-07-20": [{ subject: "DBMS", hours: 3, completed: false }, { subject: "Operating Systems", hours: 1, completed: false }],
          "2026-07-21": [{ subject: "Operating Systems", hours: 4, completed: false }]
        }
      });
    }
  };

  const createRevisionPlan = async () => {
    const subjectsList = plannerSubjects.split(',').map(s => s.trim()).filter(Boolean);
    if (subjectsList.length === 0) return alert("Please list at least one subject.");
    
    // Auto exam date mapper: 7 days out
    const defaultExams: Record<string, string> = {};
    subjectsList.forEach((sub, i) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7 + (i * 2));
      defaultExams[sub] = targetDate.toISOString().split('T')[0];
    });

    try {
      const res = await fetch(`${apiBaseUrl}/revision/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          subjects: subjectsList,
          study_hours_per_day: parseInt(plannerHours),
          exam_dates: defaultExams
        })
      });
      if (res.ok) {
        setRevisionPlan(await res.json());
      }
    } catch (err) {
      const mockTimetable: Record<string, any> = {};
      const dates = [
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 86400000).toISOString().split('T')[0],
        new Date(Date.now() + 172800000).toISOString().split('T')[0],
      ];
      
      dates.forEach(d => {
        mockTimetable[d] = subjectsList.map(s => ({ subject: s, hours: Math.ceil(parseInt(plannerHours) / subjectsList.length), completed: false }));
      });

      setRevisionPlan({
        id: 1,
        subjects: subjectsList,
        study_hours_per_day: parseInt(plannerHours),
        exam_dates: defaultExams,
        timetable: mockTimetable
      });
    }
  };

  const toggleSession = async (dateStr: string, idx: number) => {
    try {
      const res = await fetch(`${apiBaseUrl}/revision/sessions/${dateStr}/${idx}/toggle`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setRevisionPlan(await res.json());
      }
    } catch (err) {
      if (revisionPlan) {
        const copy = JSON.parse(JSON.stringify(revisionPlan));
        if (copy.timetable[dateStr] && copy.timetable[dateStr][idx]) {
          copy.timetable[dateStr][idx].completed = !copy.timetable[dateStr][idx].completed;
          setRevisionPlan(copy);
        }
      }
    }
  };

  const handleNlpCommandSubmit = async () => {
    if (!nlpCommand.trim()) return;
    setSubmittingNlp(true);
    try {
      const res = await fetch(`${apiBaseUrl}/revision/command`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ command: nlpCommand })
      });
      if (res.ok) {
        setRevisionPlan(await res.json());
      }
    } catch (err) {
      // Mock command results
      if (revisionPlan) {
        alert("Applied Timetable Shift locally!");
      }
    } finally {
      setNlpCommand('');
      setSubmittingNlp(false);
    }
  };

  const generateConceptMindmap = async (docId: number) => {
    setGeneratingMindmap(true);
    try {
      const res = await fetch(`${apiBaseUrl}/chat/mindmap/${docId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMindmapCode(data.mermaid_code);
      }
    } catch (err) {
      setMindmapCode(`graph TD
      A[Data Storage] --> B(SQL Databases)
      A --> C(NoSQL Databases)
      B --> D[PostgreSQL]
      B --> E[MySQL]
      C --> F[ChromaDB]
      C --> G[MongoDB]
      F --> H[Vector Search]`);
    } finally {
      setGeneratingMindmap(false);
    }
  };

  const requestStudyAid = async (mode: string) => {
    if (!selectedDocId) return alert("Please select a document first.");
    setGeneratingStudyAid(true);
    
    try {
      const res = await fetch(`${apiBaseUrl}/chat/study-aid`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          document_id: parseInt(selectedDocId),
          mode,
          difficulty
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Append response into message window as bot reply
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'assistant',
          content: `### Generated ${mode.replace('_', ' ').toUpperCase()} (${difficulty.toUpperCase()} level):\n\n${data.content}`
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'assistant',
        content: `### Generated Summary Overview (MOCK):\nThis document outlines essential methods for RAG vector extraction. We split texts recursively into overlap tokens, run SentenceTransformers to output dense arrays, and persist files within isolated tables.`
      }]);
    } finally {
      setGeneratingStudyAid(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/analytics/`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch (err) {
      setAnalytics({
        uploaded_documents: documents.length || 3,
        ai_conversations: chatSessions.length || 1,
        study_time_hours: 12.5,
        quizzes_generated: quizList.length || 1,
        average_quiz_score: 83.5,
        strongest_subjects: [
          { subject: "Relational Algebra", average_score: 95.0 },
          { subject: "Transactions & Concurrency", average_score: 90.0 }
        ],
        weakest_subjects: [
          { subject: "Operating Systems Locks", average_score: 72.0 }
        ],
        frequently_searched: ["ACID Properties", "Index Types", "Page Buffers"],
        current_streak: 5,
        longest_streak: 12,
        revision_progress_percent: 66.7
      });
    }
  };

  // --- RENDERS ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans p-4 relative overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-700/25 rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-[120px] animate-pulse-subtle"></div>

        <div className="w-full max-w-md glass p-8 rounded-3xl border border-slate-700/50 shadow-2xl relative z-10 transition-all duration-300">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-primary-500/10 text-primary-400 rounded-2xl mb-3 border border-primary-500/20">
              <Brain className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary-400 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">ScholarMind</h1>
            <p className="text-slate-400 text-sm mt-2">AI-Powered Personal Knowledge Engine</p>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setAuthError('');
            try {
              if (isRegisterMode) {
                await register(authName, authEmail, authPassword);
              } else {
                await login(authEmail, authPassword);
              }
            } catch (err: any) {
              setAuthError(err.message || 'Authentication error.');
            }
          }} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={authName} 
                  onChange={e => setAuthName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                value={authEmail} 
                onChange={e => setAuthEmail(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="you@university.edu"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                value={authPassword} 
                onChange={e => setAuthPassword(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {authError && (
              <div className="p-3 text-xs bg-red-950/30 border border-red-500/50 rounded-xl text-red-300">
                {authError}
              </div>
            )}

            <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 rounded-xl text-sm font-semibold shadow-lg hover:shadow-primary-500/20 transition-all duration-200 mt-2">
              {isRegisterMode ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-800 pt-6">
            <button 
              type="button" 
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setAuthError('');
              }}
              className="text-xs text-slate-400 hover:text-primary-400 transition-colors"
            >
              {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGGED IN USER INTERFACE ---
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-darkbg-300 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-200">
      
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-darkbg-100 border-r border-gray-200 dark:border-gray-800/50 flex flex-col justify-between p-6 z-20">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-600 text-white rounded-xl shadow-md">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent">ScholarMind</h2>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Workspace</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-50'}`}
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </button>

            <button 
              onClick={() => setActiveTab('documents')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'documents' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-50'}`}
            >
              <FileText className="w-4 h-4" /> Study Materials
            </button>

            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-50'}`}
            >
              <MessageSquare className="w-4 h-4" /> AI Chat
            </button>

            <button 
              onClick={() => setActiveTab('revision')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'revision' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-50'}`}
            >
              <Calendar className="w-4 h-4" /> Study Planner
            </button>

            <button 
              onClick={() => setActiveTab('quiz')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'quiz' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-50'}`}
            >
              <HelpCircle className="w-4 h-4" /> Quiz Center
            </button>

            <button 
              onClick={() => setActiveTab('flashcards')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'flashcards' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-50'}`}
            >
              <Award className="w-4 h-4" /> Flashcards
            </button>

            <button 
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-50'}`}
            >
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-50'}`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </nav>
        </div>

        {/* User Card */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              {user.full_name.charAt(0)}
            </div>
            <div className="truncate">
              <h4 className="text-sm font-semibold truncate text-gray-900 dark:text-white">{user.full_name}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-500 dark:bg-darkbg-50 dark:hover:bg-red-950/10 border border-gray-200/50 dark:border-gray-800/80 rounded-xl text-xs font-semibold transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-16 px-8 flex items-center justify-between border-b border-gray-200 dark:border-gray-800/50 bg-white/50 dark:bg-darkbg-100/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-bold capitalize text-gray-900 dark:text-white">{activeTab.replace('_', ' ')}</h2>
          <div className="flex items-center gap-4">
            
            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-full text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm">
              <Flame className="w-4 h-4 fill-amber-500 stroke-amber-500 animate-pulse" />
              <span>{analytics?.current_streak || 5} Day Streak</span>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-50 border border-gray-200/50 dark:border-gray-800/80 rounded-xl shadow-sm transition-all"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </header>

        {/* CONTAINER */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8 animate-fade-in">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Welcome banner */}
              <div className="p-8 rounded-3xl bg-gradient-to-r from-primary-600 via-indigo-600 to-indigo-700 text-white relative overflow-hidden shadow-xl border border-primary-500/20">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full filter blur-2xl transform translate-x-12 -translate-y-12"></div>
                <div className="relative z-10 space-y-2">
                  <span className="text-xs bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">Study Assistant</span>
                  <h1 className="text-3xl font-extrabold">Welcome back, {user.full_name}!</h1>
                  <p className="text-primary-100 text-sm max-w-md">Your RAG brain index has loaded {documents.length} source materials. Ready to generate notes, test yourself, or adjust your timetable?</p>
                </div>
              </div>

              {/* Stats Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-primary-100 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 rounded-xl"><FileText className="w-5 h-5" /></div>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Materials</p><h3 className="text-2xl font-bold">{documents.length} uploaded</h3></div>
                </div>

                <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><HelpCircle className="w-5 h-5" /></div>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Quizzes</p><h3 className="text-2xl font-bold">{quizList.length} total</h3></div>
                </div>

                <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><Award className="w-5 h-5" /></div>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Avg Score</p><h3 className="text-2xl font-bold">{analytics?.average_quiz_score || 83}%</h3></div>
                </div>

                <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl"><Clock className="w-5 h-5" /></div>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Study Time</p><h3 className="text-2xl font-bold">{analytics?.study_time_hours || 12} hours</h3></div>
                </div>
              </div>

              {/* Dual grid for planner preview and recent activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timetable card */}
                <div className="lg:col-span-2 p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Today's Timetable</h3>
                    <button onClick={() => setActiveTab('revision')} className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1">Go to Calendar <ChevronRight className="w-3 h-3" /></button>
                  </div>
                  {revisionPlan ? (
                    <div className="space-y-3">
                      {Object.entries(revisionPlan.timetable).slice(0, 1).map(([dateStr, sessions]: any) => (
                        <div key={dateStr} className="space-y-2">
                          <p className="text-xs text-gray-400 mb-2">{new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                          {(sessions as any[]).map((sess: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-darkbg-50 border border-gray-200/50 dark:border-gray-800/80 rounded-xl">
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-full ${sess.completed ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-semibold text-sm">{sess.subject}</span>
                              </div>
                              <span className="text-xs bg-primary-100 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400 px-2.5 py-1 rounded-full font-bold">{sess.hours} Hours</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">No active schedule. Initialize one in the planner.</div>
                  )}
                </div>

                {/* Subjects strength card */}
                <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm space-y-6">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Topic Strengths</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-2">Strongest Areas</span>
                      {analytics?.strongest_subjects.map((sub: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/20 rounded-xl mb-2">
                          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{sub.subject}</span>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{sub.average_score}%</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-2">Needs Revision</span>
                      {analytics?.weakest_subjects.map((sub: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/20 rounded-xl mb-2">
                          <span className="text-sm font-medium text-rose-800 dark:text-rose-300">{sub.subject}</span>
                          <span className="text-xs font-bold text-rose-700 dark:text-rose-400">{sub.average_score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Drag and Drop Container */}
                <div 
                  className={`lg:col-span-1 p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragActive ? 'border-primary-500 bg-primary-50/10' : 'border-gray-300 dark:border-gray-800 bg-white dark:bg-darkbg-100'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.onchange = (e: any) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUpload(e.target.files[0]);
                      }
                    };
                    input.click();
                  }}
                >
                  {uploading ? (
                    <div className="space-y-4">
                      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm font-medium text-gray-500">Uploading and indexing document...</p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-gray-500">
                      <div className="p-4 bg-gray-100 dark:bg-darkbg-50 text-gray-400 dark:text-gray-500 rounded-2xl inline-flex"><UploadCloud className="w-8 h-8" /></div>
                      <div>
                        <h4 className="font-bold text-gray-800 dark:text-white text-base">Drag & Drop Study Files</h4>
                        <p className="text-xs mt-1">PDF, DOCX, PPTX, TXT, MD, or Code</p>
                      </div>
                      <span className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors">Select File</span>
                    </div>
                  )}
                </div>

                {/* Document Table */}
                <div className="lg:col-span-2 p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm space-y-6">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Uploaded Materials</h3>
                  {documents.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 rounded-xl"><FileText className="w-4 h-4" /></div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{doc.filename}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{(doc.file_size / (1024 * 1024)).toFixed(2)} MB • {doc.file_type.toUpperCase()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold ${
                              doc.status === 'processed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
                            }`}>
                              {doc.status}
                            </span>
                            <button 
                              onClick={() => deleteDocument(doc.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">No documents found. Drag & drop files to populate your knowledge assistant.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-220px)]">
              {/* Sidebar config options */}
              <div className="lg:col-span-1 p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Study Controls</h3>
                  
                  {/* Select Doc */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Target Material</label>
                    <select 
                      value={selectedDocId} 
                      onChange={e => setSelectedDocId(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-darkbg-50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500"
                    >
                      <option value="">Query all materials</option>
                      {documents.filter(d => d.status === 'processed').map((doc: any) => (
                        <option key={doc.id} value={doc.id}>{doc.filename}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Explanation Level</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['beginner', 'intermediate', 'advanced', 'interview'] as const).map(level => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`py-2 px-3 border rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                            difficulty === level ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-transparent border-gray-200 dark:border-gray-800 text-gray-500'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Study aids shortcut buttons */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-3">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Instant Study Aids</label>
                    <button 
                      onClick={() => requestStudyAid('summary')}
                      disabled={generatingStudyAid}
                      className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-darkbg-50 dark:hover:bg-darkbg-300 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold flex items-center justify-between transition-all"
                    >
                      <span>Generate Summary</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    
                    <button 
                      onClick={() => requestStudyAid('revision_sheet')}
                      disabled={generatingStudyAid}
                      className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-darkbg-50 dark:hover:bg-darkbg-300 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold flex items-center justify-between transition-all"
                    >
                      <span>1-Page Revision Sheet</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    <button 
                      onClick={() => requestStudyAid('interview_prep')}
                      disabled={generatingStudyAid}
                      className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-darkbg-50 dark:hover:bg-darkbg-300 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold flex items-center justify-between transition-all"
                    >
                      <span>Interview Prep Guide</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {selectedDocId && (
                      <button 
                        onClick={() => generateConceptMindmap(parseInt(selectedDocId))}
                        disabled={generatingMindmap}
                        className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 rounded-xl text-xs font-bold flex items-center justify-between transition-all"
                      >
                        <span>Render Concept Mind Map</span>
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <button 
                    onClick={createChatSession}
                    className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Plus className="w-4 h-4" /> New Conversation
                  </button>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="lg:col-span-3 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
                {/* Messages Window */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  {messages.length > 0 ? (
                    messages.map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm space-y-3 ${
                          msg.sender === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-gray-50 dark:bg-darkbg-50 text-gray-800 dark:text-gray-100 border border-gray-200/50 dark:border-gray-850 rounded-tl-none'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="flex flex-wrap gap-2 border-t border-gray-200/50 dark:border-gray-700/50 pt-2 text-[10px] text-gray-500 dark:text-gray-400">
                              <span className="font-bold">Sources:</span>
                              {msg.citations.map((cite: any, idx: number) => (
                                <span key={idx} className="bg-gray-100 dark:bg-darkbg-100 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-800">{cite.filename} (Page {cite.page})</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                      <MessageSquare className="w-8 h-8 text-gray-300" />
                      <p className="text-sm font-medium">Ask questions relative to database models, revision aids, or index pages.</p>
                    </div>
                  )}

                  {/* Render Mermaid mindmap inline if generated */}
                  {mindmapCode && (
                    <div className="space-y-2 animate-fade-in">
                      <h4 className="text-xs font-bold text-gray-400 uppercase">Concept Mind Map</h4>
                      <Mindmap code={mindmapCode} />
                    </div>
                  )}
                </div>

                {/* Input form */}
                <div className="p-4 border-t border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-darkbg-100/50">
                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                    <input 
                      type="text" 
                      value={inputMessage}
                      onChange={e => setInputMessage(e.target.value)}
                      placeholder={`Ask ScholarMind knowledge assistant about study topics...`}
                      className="flex-1 bg-white dark:bg-darkbg-50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 dark:text-white"
                      disabled={sendingMessage}
                    />
                    <button 
                      type="submit" 
                      className="p-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-md transition-colors"
                      disabled={sendingMessage || !inputMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* REVISION PLANNER TAB */}
          {activeTab === 'revision' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Creator Card */}
              <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm space-y-6">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Initialize Study Plan</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subject List</label>
                    <input 
                      type="text" 
                      value={plannerSubjects}
                      onChange={e => setPlannerSubjects(e.target.value)}
                      placeholder="DBMS, Operating Systems, Computer Networks"
                      className="w-full bg-gray-50 dark:bg-darkbg-50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Separate subjects by commas.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Study Hours Per Day</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="12"
                      value={plannerHours}
                      onChange={e => setPlannerHours(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-darkbg-50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <button 
                    onClick={createRevisionPlan}
                    className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    Build Dynamic Timetable
                  </button>
                </div>
              </div>

              {/* Timetable Calendar Display */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Conversational Schedule Editor</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={nlpCommand}
                      onChange={e => setNlpCommand(e.target.value)}
                      placeholder="Try: 'Move DBMS to tomorrow' or 'Add another hour of OS today'"
                      className="flex-1 bg-gray-50 dark:bg-darkbg-50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500"
                    />
                    <button 
                      onClick={handleNlpCommandSubmit}
                      disabled={submittingNlp || !nlpCommand.trim()}
                      className="px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      {submittingNlp ? 'Updating...' : 'Apply Command'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Active Timetable</h3>
                  {revisionPlan ? (
                    <div className="space-y-4">
                      {Object.entries(revisionPlan.timetable).map(([dateStr, sessions]: any) => (
                        <div key={dateStr} className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm space-y-3">
                          <h4 className="font-bold text-sm text-gray-500 dark:text-gray-400">{new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(sessions as any[]).map((sess: any, idx: number) => (
                              <div 
                                key={idx} 
                                onClick={() => toggleSession(dateStr, idx)}
                                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                  sess.completed 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300' 
                                    : 'bg-gray-50 dark:bg-darkbg-50 border-gray-250 dark:border-gray-800/80 text-gray-800 dark:text-gray-200 hover:border-primary-500'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1 rounded-full ${sess.completed ? 'bg-emerald-600 text-white' : 'bg-gray-300 dark:bg-gray-800 text-transparent'}`}>
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-semibold text-sm">{sess.subject}</span>
                                </div>
                                <span className="text-xs font-bold opacity-75">{sess.hours}h</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white dark:bg-darkbg-100 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-400">Initialize subjects list to build schedule layout.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* QUIZ TAB */}
          {activeTab === 'quiz' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Quiz list sidebar */}
              <div className="lg:col-span-1 p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm space-y-6">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Quiz Center</h3>
                
                {/* Generate form */}
                <div className="space-y-4 pt-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Build New Quiz</label>
                  <select 
                    id="quiz-doc-select"
                    className="w-full bg-gray-50 dark:bg-darkbg-50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500"
                  >
                    {documents.filter(d => d.status === 'processed').map((doc: any) => (
                      <option key={doc.id} value={doc.id}>{doc.filename}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('quiz-doc-select') as HTMLSelectElement;
                      if (el && el.value) generateQuiz(parseInt(el.value));
                    }}
                    disabled={generatingQuiz || documents.length === 0}
                    className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    {generatingQuiz ? 'Generating...' : 'Generate AI Quiz'}
                  </button>
                </div>

                {/* List */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Available Quizzes</label>
                  {quizList.map((q: any) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        setActiveQuiz(q);
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                        setQuizScore(null);
                      }}
                      className={`w-full p-4 border rounded-xl text-left transition-all ${
                        activeQuiz?.id === q.id 
                          ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-500 text-primary-900 dark:text-primary-300' 
                          : 'bg-transparent border-gray-200 dark:border-gray-850 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <h4 className="text-sm font-semibold truncate">{q.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{q.questions.length} Questions • {q.score !== null ? `Score: ${q.score}/${q.max_score}` : 'Not taken'}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Quiz Sheet */}
              <div className="lg:col-span-3 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm p-8 space-y-8">
                {activeQuiz ? (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeQuiz.title}</h2>
                      {quizSubmitted && (
                        <span className="px-4 py-1.5 bg-primary-100 text-primary-800 dark:bg-primary-950/30 dark:text-primary-400 rounded-full font-bold text-sm">
                          Score: {quizScore} / {activeQuiz.max_score}
                        </span>
                      )}
                    </div>

                    <div className="space-y-6">
                      {activeQuiz.questions.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="space-y-3 p-6 bg-gray-50 dark:bg-darkbg-50 rounded-xl border border-gray-200/50 dark:border-gray-850">
                          <h4 className="font-semibold text-base text-gray-900 dark:text-white">Q{qIdx + 1}. {q.question}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {q.options.map((opt: string, oIdx: number) => {
                              const isSelected = quizAnswers[qIdx] === opt;
                              const isCorrect = q.correct_answer === opt;
                              
                              let btnClass = "bg-white dark:bg-darkbg-100 border-gray-200 dark:border-gray-805";
                              if (isSelected && !quizSubmitted) btnClass = "border-primary-500 bg-primary-50/20 text-primary-700 dark:text-primary-300";
                              if (quizSubmitted) {
                                if (isCorrect) btnClass = "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400";
                                else if (isSelected) btnClass = "bg-rose-50 border-rose-500 text-rose-805 dark:bg-rose-950/20 dark:text-rose-450";
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [qIdx]: opt }))}
                                  className={`p-4 rounded-xl border text-left text-sm font-medium transition-all ${btnClass}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <div className="mt-4 p-4 bg-primary-50/20 dark:bg-primary-950/10 rounded-lg text-xs text-gray-500 dark:text-gray-400 border border-primary-200/20">
                              <span className="font-bold block mb-1">Explanation:</span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {!quizSubmitted ? (
                      <button 
                        onClick={() => {
                          let finalScore = 0;
                          activeQuiz.questions.forEach((q: any, idx: number) => {
                            if (quizAnswers[idx] === q.correct_answer) finalScore++;
                          });
                          setQuizScore(finalScore);
                          setQuizSubmitted(true);
                          submitQuiz(finalScore);
                        }}
                        disabled={Object.keys(quizAnswers).length < activeQuiz.questions.length}
                        className="py-3.5 px-6 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition-colors"
                      >
                        Submit Quiz Responses
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                          setQuizScore(null);
                        }}
                        className="py-3.5 px-6 bg-gray-100 hover:bg-gray-250 text-gray-800 dark:bg-darkbg-50 dark:hover:bg-darkbg-300 dark:text-white rounded-xl font-bold transition-colors"
                      >
                        Retry Quiz
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-24 text-gray-400 space-y-4">
                    <HelpCircle className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="font-bold text-lg text-gray-600 dark:text-gray-300">Choose a document quiz to proceed.</h3>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FLASHCARDS TAB */}
          {activeTab === 'flashcards' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Flashcards sidebar */}
              <div className="lg:col-span-1 p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm space-y-6">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Flashcard Center</h3>
                
                {/* Generate form */}
                <div className="space-y-4 pt-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Build New Flashcards</label>
                  <select 
                    id="cards-doc-select"
                    className="w-full bg-gray-50 dark:bg-darkbg-50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500"
                  >
                    {documents.filter(d => d.status === 'processed').map((doc: any) => (
                      <option key={doc.id} value={doc.id}>{doc.filename}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('cards-doc-select') as HTMLSelectElement;
                      if (el && el.value) generateFlashcards(parseInt(el.value));
                    }}
                    disabled={generatingCards || documents.length === 0}
                    className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    {generatingCards ? 'Generating...' : 'Generate Deck'}
                  </button>
                </div>

                {/* List */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Available Decks</label>
                  {flashcardSets.map((set: any) => (
                    <button
                      key={set.id}
                      onClick={() => {
                        setActiveFlashcardSet(set);
                        setCurrentCardIndex(0);
                        setCardFlipped(false);
                      }}
                      className={`w-full p-4 border rounded-xl text-left transition-all ${
                        activeFlashcardSet?.id === set.id 
                          ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-500 text-primary-900 dark:text-primary-300' 
                          : 'bg-transparent border-gray-200 dark:border-gray-850 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <h4 className="text-sm font-semibold truncate">{set.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{set.cards.length} Flashcards</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deck Viewer */}
              <div className="lg:col-span-3 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center space-y-8">
                {activeFlashcardSet ? (
                  <div className="w-full max-w-md text-center space-y-8">
                    <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200">{activeFlashcardSet.title}</h3>
                    
                    {/* Card container */}
                    <div 
                      onClick={() => setCardFlipped(!cardFlipped)}
                      className="h-64 w-full cursor-pointer perspective-1000"
                    >
                      <div className={`w-full h-full duration-500 preserve-3d relative ${cardFlipped ? 'rotate-y-180' : ''}`}>
                        
                        {/* Front Side */}
                        <div className="absolute inset-0 bg-primary-600 text-white rounded-3xl p-8 flex items-center justify-center font-bold text-xl backface-hidden shadow-xl border border-primary-500/20">
                          <p>{activeFlashcardSet.cards[currentCardIndex].front}</p>
                          <span className="absolute bottom-4 right-6 text-[10px] uppercase tracking-wider font-semibold opacity-75">Click to flip</span>
                        </div>

                        {/* Back Side */}
                        <div className="absolute inset-0 bg-gray-50 dark:bg-darkbg-50 text-gray-900 dark:text-white rounded-3xl p-8 flex items-center justify-center font-medium text-base rotate-y-180 backface-hidden shadow-xl border border-gray-200 dark:border-gray-800">
                          <p>{activeFlashcardSet.cards[currentCardIndex].back}</p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center px-4">
                      <button 
                        onClick={() => {
                          setCurrentCardIndex(prev => Math.max(0, prev - 1));
                          setCardFlipped(false);
                        }}
                        disabled={currentCardIndex === 0}
                        className="py-2 px-5 bg-gray-150 dark:bg-darkbg-50 rounded-xl font-bold text-xs disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-gray-400 font-semibold">{currentCardIndex + 1} / {activeFlashcardSet.cards.length}</span>
                      <button 
                        onClick={() => {
                          setCurrentCardIndex(prev => Math.min(activeFlashcardSet.cards.length - 1, prev + 1));
                          setCardFlipped(false);
                        }}
                        disabled={currentCardIndex === activeFlashcardSet.cards.length - 1}
                        className="py-2 px-5 bg-gray-150 dark:bg-darkbg-50 rounded-xl font-bold text-xs disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24 text-gray-400 space-y-4">
                    <Brain className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="font-bold text-lg text-gray-600 dark:text-gray-300">Choose a vocabulary set to start memorizing.</h3>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-8">
              {/* Upper widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase">Longest Streak</h5>
                    <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">{analytics.longest_streak} Days</h3>
                  </div>
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl"><Flame className="w-8 h-8 fill-indigo-500 stroke-indigo-500" /></div>
                </div>

                <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase">Revision Progress</h5>
                    <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{analytics.revision_progress_percent}%</h3>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl"><ShieldCheck className="w-8 h-8" /></div>
                </div>

                <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase">Search Trends</h5>
                    <div className="flex gap-1.5 flex-wrap mt-3">
                      {analytics.frequently_searched.map((tag: string, idx: number) => (
                        <span key={idx} className="bg-gray-100 dark:bg-darkbg-50 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm space-y-6">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Active Daily Study Sessions</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { date: 'Mon', hours: 2 },
                        { date: 'Tue', hours: 4 },
                        { date: 'Wed', hours: 3 },
                        { date: 'Thu', hours: 5.5 },
                        { date: 'Fri', hours: 4 },
                        { date: 'Sat', hours: 1 },
                        { date: 'Sun', hours: 2.5 }
                      ]}>
                        <defs>
                          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5867f5" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#5867f5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229, 231, 235, 0.1)" />
                        <XAxis dataKey="date" stroke="rgba(156, 163, 175, 0.5)" />
                        <YAxis stroke="rgba(156, 163, 175, 0.5)" />
                        <Tooltip />
                        <Area type="monotone" dataKey="hours" stroke="#5867f5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHours)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm space-y-6">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Quiz Score Trends</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Relational DB', score: 95 },
                        { name: 'Transactions', score: 88 },
                        { name: 'Index Structures', score: 83 },
                        { name: 'OS Locks', score: 72 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229, 231, 235, 0.1)" />
                        <XAxis dataKey="name" stroke="rgba(156, 163, 175, 0.5)" />
                        <YAxis max={100} stroke="rgba(156, 163, 175, 0.5)" />
                        <Tooltip />
                        <Bar dataKey="score" fill="#3f44ea" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE & SETTINGS TAB */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl bg-white dark:bg-darkbg-100 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm p-8 space-y-8">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">User configurations</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={user.full_name}
                    disabled
                    className="w-full bg-gray-50 dark:bg-darkbg-50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Workspace Email</label>
                  <input 
                    type="email" 
                    value={user.email}
                    disabled
                    className="w-full bg-gray-50 dark:bg-darkbg-50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">RAG Engine Provider</label>
                  <select className="w-full bg-gray-50 dark:bg-darkbg-50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none">
                    <option value="gemini">Google Gemini API (Default)</option>
                    <option value="openai">OpenAI (GPT-4o)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ScholarMindApp />
    </AuthProvider>
  );
}
