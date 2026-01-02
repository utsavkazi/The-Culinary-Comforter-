
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Mood, Budget, Recommendation, User, CookbookRecipe } from './types';
import { getChefRecommendation, generateAudioNarration, generateMainImage, generateStepImage } from './geminiService';
import { COOKBOOK_RECIPES } from './cookbookData';
import { 
  Utensils, 
  ChefHat, 
  Smile, 
  Zap, 
  CloudRain, 
  Battery, 
  AlertCircle, 
  Heart,
  DollarSign,
  Clock,
  Sparkles,
  Loader2,
  BookOpen,
  MessageSquareQuote,
  Moon,
  Sun,
  Share2,
  Check,
  ChevronLeft,
  Volume2,
  Pause,
  Leaf,
  Play,
  Bookmark,
  Trash2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Plus,
  Menu,
  X,
  ChevronRight,
  Library,
  History,
  User as UserIcon,
  ShieldAlert,
  Ban,
  AlertTriangle,
  ScrollText,
  Stamp,
  Compass,
  Trophy
} from 'lucide-react';

// --- Utility Components ---

const StickyBackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div className="sticky top-[68px] sm:top-[76px] z-50 py-1 pointer-events-none">
    <button 
      onClick={onClick} 
      className="pointer-events-auto flex items-center gap-2.5 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl text-white font-bold uppercase tracking-[0.2em] text-[9px] group border border-white/10 shadow-2xl transition-all"
    >
      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
      Back
    </button>
  </div>
);

const PrepTimeBadge: React.FC<{ time: string, compact?: boolean }> = ({ time, compact }) => (
  <div className={`relative group flex items-center gap-2 rounded-2xl backdrop-blur-md animate-simmer animate-glow-pulse transition-all overflow-hidden ${compact ? 'px-3 py-1.5 text-[9px]' : 'bg-white/10 px-6 py-3 text-sm'} border border-white/10 shadow-lg`}>
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="steam-line animate-steam" style={{ left: `${15 + i * 20}%`, animationDelay: `${i * 0.4}s` }}></div>
      ))}
    </div>
    <div className="relative z-10 flex items-center gap-2">
      <Clock className={`${compact ? 'w-3 h-3' : 'w-5 h-5'} transition-transform group-hover:rotate-12 text-white/80`} />
      <span className="font-bold uppercase tracking-[0.2em] text-white whitespace-nowrap">{time || "20 mins"}</span>
    </div>
  </div>
);

const CHEF_MESSAGES = [
  "Consulting the seasonal harvest...",
  "Analyzing your emotional resonance...",
  "Selecting the finest aromatic herbs...",
  "Simmering a palette of possibilities...",
  "Plating your personalized comfort...",
  "Sketching visual guides for your journey...",
  "Whisking together science and soul...",
  "Harvesting local inspiration...",
  "Perfecting the temperature of your joy..."
];

const LoadingOverlay: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIdx((prev) => (prev + 1) % CHEF_MESSAGES.length);
        setFade(true);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-chefGreen-dark flex flex-col items-center justify-center animate-in fade-in duration-700 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-chefGreen/20 blur-[120px] rounded-full animate-pulse"></div>
      </div>
      <div className="relative z-10 text-center space-y-16 max-w-2xl px-6">
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full scale-150 animate-pulse duration-1000"></div>
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-full flex justify-center pointer-events-none">
              <div className="relative w-24 h-32">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="steam-line animate-steam" style={{ left: `${10 + i * 12}%`, animationDelay: `${i * 0.4}s` }}></div>
                ))}
              </div>
            </div>
            <div className="relative z-10 p-8 bg-stone-900/50 backdrop-blur-3xl rounded-full border border-white/5 shadow-2xl">
              <ChefHat className="w-16 h-16 text-chefGreen animate-bounce" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className={`transition-all duration-700 transform ${fade ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
            <h2 className="text-white text-3xl sm:text-5xl font-bold italic serif tracking-tight">
              {CHEF_MESSAGES[msgIdx]}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

const STORAGE_KEY = 'culinary_comforter_user_profile';
const SAVED_RECIPES_KEY = 'culinary_comforter_saved_recipes';

const MOOD_OPTIONS = [
  { value: Mood.HAPPY, icon: <Smile className="w-5 h-5" />, label: 'Happy' },
  { value: Mood.ENERGETIC, icon: <Zap className="w-5 h-5" />, label: 'Energetic' },
  { value: Mood.STRESSED, icon: <CloudRain className="w-5 h-5" />, label: 'Stressed' },
  { value: Mood.TIRED, icon: <Battery className="w-5 h-5" />, label: 'Tired' },
  { value: Mood.SAD, icon: <Moon className="w-5 h-5" />, label: 'Sad' },
  { value: Mood.ANXIOUS, icon: <AlertCircle className="w-5 h-5" />, label: 'Anxious' },
  { value: Mood.LONELY, icon: <Heart className="w-5 h-5" />, label: 'Lonely' },
];

const BUDGET_OPTIONS = [
  { value: Budget.LOW },
  { value: Budget.MID },
  { value: Budget.HIGH },
  { value: Budget.UNDECIDED },
];

const DIETARY_OPTIONS = [
  "Vegan", "Vegetarian", "Pescetarian", "Gluten-Free", "Dairy-Free", "Keto", "Paleo"
];

// Type to represent saved items which can be AI generated or Cookbook items
type SavedRecipe = Recommendation | CookbookRecipe;

export default function App() {
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed?.fullName) return parsed;
    } catch {}
    return { fullName: 'Guest Chef', email: '', age: 30, nationality: 'Global Citizen', dietaryPreferences: [], allergies: '' };
  });

  const [view, setView] = useState<'home' | 'result' | 'collection' | 'cookbook' | 'cookbook-detail' | 'guide'>('home');
  const [prevView, setPrevView] = useState<'home' | 'collection' | 'cookbook' | null>(null);
  const [mood, setMood] = useState<Mood | null>(Mood.HAPPY);
  const [budget, setBudget] = useState<Budget>(Budget.MID);
  const [context, setContext] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  
  // API Key Check and initial error state
  const isApiKeyMissing = !process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const [error, setError] = useState<string | null>(
    isApiKeyMissing ? "The chef's tools (API Key) are missing. Please configure NEXT_PUBLIC_GEMINI_API_KEY to begin." : null
  );

  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const [dietary, setDietary] = useState<string[]>(user.dietaryPreferences || []);
  const [allergies, setAllergies] = useState(user.allergies || '');
  
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>(() => {
    try { 
      const stored = localStorage.getItem(SAVED_RECIPES_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [cookbookSearch, setCookbookSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [selectedCookbookRecipe, setSelectedCookbookRecipe] = useState<CookbookRecipe | null>(null);
  const [cookbookStepImages, setCookbookStepImages] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUser(prev => ({ ...prev, location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } })),
        (err) => console.warn("Geolocation skipped", err)
      );
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  // Ensure Kitchen Notice hides if key is detected (in case of dynamic injection/updates)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY && error?.includes("API Key")) {
      setError(null);
    }
  }, [process.env.NEXT_PUBLIC_GEMINI_API_KEY, error]);

  const handleGenerate = async () => {
    if (isApiKeyMissing) return;
    setError(null);
    setLoading(true);
    try {
      const updatedUser = { ...user, dietaryPreferences: dietary, allergies };
      const result = await getChefRecommendation(mood, budget, updatedUser, context);
      setRecommendation(result);
      setCompletedSteps([]);
      setPrevView(view);
      setView('result');
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      (async () => {
        try {
          const mainUrl = await generateMainImage(result.dishName);
          setRecommendation(prev => prev ? { ...prev, imageUrl: mainUrl } : null);
          for (let i = 0; i < Math.min(result.instructions.length, 4); i++) {
            const stepUrl = await generateStepImage(result.instructions[i], result.dishName);
            setRecommendation(prev => {
              if (!prev) return null;
              const images = [...(prev.stepImages || new Array(result.instructions.length).fill(""))];
              images[i] = stepUrl;
              return { ...prev, stepImages: images };
            });
          }
        } catch (e) { console.error("Image generation failed", e); }
      })();
    } catch (err: any) {
      setError(err?.message || "Failed to compose meal. Please try again.");
      setLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e) {} audioSourceRef.current = null; }
  };

  const handleGoBack = () => {
    stopAudio();
    if (view === 'guide') {
      if (selectedCookbookRecipe) setView('cookbook-detail');
      else setView('result');
    }
    else if (view === 'result' && prevView === 'collection') setView('collection');
    else if (view === 'cookbook-detail') setView('cookbook');
    else setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRecipeName = (recipe: SavedRecipe) => {
    return (recipe as Recommendation).dishName || (recipe as CookbookRecipe).title;
  };

  const isRecipeSaved = (name?: string) => {
    if (!name) return false;
    return savedRecipes.some(r => r && getRecipeName(r) === name);
  };

  const toggleSaveRecipe = (recipe: SavedRecipe | null) => {
    if (!recipe) return;
    const name = getRecipeName(recipe);
    if (!name) return;

    setSavedRecipes(prev => {
      const exists = prev.some(r => r && getRecipeName(r) === name);
      if (exists) return prev.filter(r => r && getRecipeName(r) !== name);
      return [...prev, recipe];
    });
  };

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const toggleDietary = (option: string) => {
    setDietary(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]);
  };

  const startGuideForCookbook = async (recipe: CookbookRecipe) => {
    if (isApiKeyMissing) return;
    setCompletedSteps([]);
    setView('guide');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Lazy generate step images for cookbook if missing to provide "image guidance"
    if (!cookbookStepImages[recipe.id]) {
      const placeholders = new Array(recipe.instructions.length).fill("");
      setCookbookStepImages(prev => ({ ...prev, [recipe.id]: placeholders }));
      
      for (let i = 0; i < recipe.instructions.length; i++) {
        try {
          const url = await generateStepImage(recipe.instructions[i], recipe.title);
          setCookbookStepImages(prev => {
            const current = [...prev[recipe.id]];
            current[i] = url;
            return { ...prev, [recipe.id]: current };
          });
        } catch (e) {
          console.error("Failed to generate guide image for cookbook step", e);
        }
      }
    }
  };

  const filteredCookbook = useMemo(() => COOKBOOK_RECIPES.filter(r => 
    (selectedCategory === 'All' || r.category === selectedCategory) &&
    (r.title.toLowerCase().includes(cookbookSearch.toLowerCase()))
  ), [cookbookSearch, selectedCategory]);

  const loadSavedRecipe = (recipe: SavedRecipe) => {
    stopAudio();
    if ((recipe as CookbookRecipe).id) {
        setSelectedCookbookRecipe(recipe as CookbookRecipe);
        setView('cookbook-detail');
    } else {
        setRecommendation(recipe as Recommendation);
        setCompletedSteps([]);
        setPrevView('collection');
        setView('result');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeGuideData = useMemo(() => {
    if (view !== 'guide') return null;
    if (recommendation) {
      return {
        name: recommendation.dishName,
        instructions: recommendation.instructions,
        images: recommendation.stepImages || []
      };
    }
    if (selectedCookbookRecipe) {
      return {
        name: selectedCookbookRecipe.title,
        instructions: selectedCookbookRecipe.instructions,
        images: cookbookStepImages[selectedCookbookRecipe.id] || []
      };
    }
    return null;
  }, [view, recommendation, selectedCookbookRecipe, cookbookStepImages]);

  return (
    <div className="min-h-screen bg-chefGreen dark:bg-chefGreen-dark transition-colors duration-500 pb-24 overflow-x-hidden">
      <LoadingOverlay isVisible={loading} />
      
      {/* Updated Header with Glassmorphism, 10px blur, and thin border */}
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-chefGreen/60 dark:bg-chefGreen-dark/60 backdrop-blur-[10px] border-b border-white/10 py-5 sm:py-6 px-6 sm:px-10 shadow-xl transition-all duration-500">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('home')}>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shadow-xl group-hover:scale-110 transition-transform text-white">
              <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 animate-bob-subtle" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white italic serif drop-shadow-lg">The Culinary Comforter</h1>
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-xl bg-white/10 text-white border border-white/20 shadow-lg hover:bg-white/20 transition-all"><Menu className="w-5 h-5" /></button>
        </div>
      </nav>

      {/* Slide-out Menu */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        <div onClick={() => setIsMenuOpen(false)} className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute top-0 right-0 h-full w-[260px] bg-stone-900/98 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/10 transition-transform duration-500 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="p-6 flex justify-between items-center border-b border-white/5 text-white">
            <span className="text-lg font-bold serif italic">Studio Menu</span>
            <button onClick={() => setIsMenuOpen(false)}><X className="w-5 h-5 opacity-40 hover:opacity-100" /></button>
          </div>
          <div className="flex-1 p-4 space-y-2">
            <button onClick={() => { setView('home'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'home' ? 'bg-chefGreen text-white' : 'text-white/70 hover:bg-white/5'}`}><Sparkles className="w-4 h-4" /> Home Studio</button>
            <button onClick={() => { setView('cookbook'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'cookbook' ? 'bg-chefGreen text-white' : 'text-white/70 hover:bg-white/5'}`}><Library className="w-4 h-4" /> The Chef's Secret</button>
            <button onClick={() => { setView('collection'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'collection' ? 'bg-chefGreen text-white' : 'text-white/70 hover:bg-white/5'}`}><Bookmark className="w-4 h-4" /> Saved Recipes</button>
            <div className="h-px bg-white/5 my-4"></div>
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="w-full flex items-center justify-between p-3 rounded-xl text-white/70 hover:bg-white/5">
              <div className="flex items-center gap-3">{theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} Mode</div>
              <div className={`w-10 h-5 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-chefGreen' : 'bg-stone-700'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`}></div></div>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 sm:px-10 mt-36 sm:mt-40">
        {view === 'home' ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto space-y-12 pb-20">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-[2rem] flex items-center gap-4 text-red-200">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <div className="space-y-1"><p className="font-bold serif italic text-lg">Kitchen Notice</p><p className="text-sm opacity-80">{error}</p></div>
              </div>
            )}
            <div className="bg-white/10 backdrop-blur-xl p-8 sm:p-14 rounded-[3rem] border border-white/15 shadow-3xl space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-4xl sm:text-5xl font-bold text-white serif italic">The Culinary Studio</h2>
                <p className="text-white/50 italic font-medium leading-relaxed">"Describe your spirit, and let us compose a harmony for your table."</p>
              </div>
              <div className="space-y-10">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3"><MessageSquareQuote className="w-4 h-4 text-chefGreen" /> Inner Narrative</h3>
                  <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Tell me of your day..." className="w-full h-32 p-6 rounded-3xl bg-black/20 text-white placeholder:text-white/15 border border-white/10 outline-none transition-all resize-none text-lg serif italic" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3"><Smile className="w-4 h-4 text-chefGreen" /> Vibration</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {MOOD_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => setMood(opt.value)} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${mood === opt.value ? 'bg-white text-[#016B61] border-transparent shadow-xl scale-105' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}>
                          <span className="mb-1">{opt.icon}</span><span className="text-[8px] font-bold uppercase tracking-widest">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3"><DollarSign className="w-4 h-4 text-chefGreen" /> Aura</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {BUDGET_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => setBudget(opt.value)} className={`py-5 rounded-2xl border transition-all text-[8px] font-bold uppercase tracking-[0.2em] ${budget === opt.value ? 'bg-white text-[#016B61] border-transparent shadow-xl scale-105' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}>{opt.value}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                      <Leaf className="w-4 h-4 text-chefGreen" /> Essence (Dietary)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map((opt) => (
                        <button 
                          key={opt} 
                          onClick={() => toggleDietary(opt)} 
                          className={`px-4 py-2 rounded-full border text-[8px] font-bold uppercase tracking-widest transition-all ${dietary.includes(opt) ? 'bg-chefGreen text-white border-transparent shadow-glow' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                      <ShieldAlert className="w-4 h-4 text-chefGreen" /> Vital Protections (Allergies)
                    </h3>
                    <div className="relative">
                      <Ban className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        type="text" 
                        value={allergies} 
                        onChange={(e) => setAllergies(e.target.value)} 
                        placeholder="List any sensitivities..." 
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-black/20 text-white placeholder:text-white/15 border border-white/10 focus:border-chefGreen outline-none transition-all text-sm italic serif"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleGenerate} 
                disabled={loading || isApiKeyMissing} 
                className="w-full bg-white text-[#016B61] py-6 rounded-[2rem] font-bold text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                Compose My Meal
              </button>
            </div>
          </div>
        ) : view === 'cookbook' ? (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 max-w-6xl mx-auto pb-40 space-y-12">
            <StickyBackButton onClick={() => setView('home')} />
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/5 pb-10">
              <h2 className="text-4xl sm:text-6xl font-bold text-white serif italic">The Chef's Secret</h2>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {['All', ...new Set(COOKBOOK_RECIPES.map(r => r.category))].map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase border whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-white text-chefGreen border-white shadow-xl' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}>{cat}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredCookbook.map(recipe => (
                <div 
                  key={recipe.id} 
                  onClick={() => { setSelectedCookbookRecipe(recipe); setView('cookbook-detail'); }} 
                  className="bg-white/[0.03] backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 cursor-pointer shadow-xl hover:shadow-glow hover:-translate-y-3 transition-all group flex flex-col h-full ring-1 ring-white/5 hover:ring-white/20 relative"
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleSaveRecipe(recipe); }}
                    className={`absolute top-8 right-8 p-3 rounded-full border transition-all active:scale-90 ${isRecipeSaved(recipe.title) ? 'bg-chefGreen text-white border-chefGreen shadow-glow' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/20'}`}
                  >
                    <Heart className={`w-5 h-5 ${isRecipeSaved(recipe.title) ? 'fill-white' : ''}`} />
                  </button>
                  <Stamp className="w-7 h-7 text-white/20 group-hover:text-chefGreen group-hover:scale-110 transition-all mb-6" />
                  <h3 className="text-3xl font-bold text-white serif italic mb-3 leading-tight">{recipe.title}</h3>
                  <p className="text-white/40 text-base italic serif leading-relaxed flex-1">"{recipe.preview}"</p>
                  <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-chefGreen opacity-0 group-hover:opacity-100 transition-opacity">
                    View Manuscript <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : view === 'cookbook-detail' && selectedCookbookRecipe ? (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 max-w-6xl mx-auto pb-40 space-y-8">
            <StickyBackButton onClick={() => setView('cookbook')} />
            <div className="bg-white/[0.04] p-12 sm:p-24 rounded-[4rem] border border-white/5 space-y-16 backdrop-blur-[60px] shadow-3xl ring-1 ring-white/10">
              <div className="text-center space-y-6 relative">
                <button 
                  onClick={() => toggleSaveRecipe(selectedCookbookRecipe)}
                  className={`absolute top-0 right-0 p-5 rounded-full border transition-all active:scale-90 shadow-2xl ${isRecipeSaved(selectedCookbookRecipe.title) ? 'bg-chefGreen text-white border-chefGreen shadow-glow' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                >
                  <Heart className={`w-7 h-7 ${isRecipeSaved(selectedCookbookRecipe.title) ? 'fill-white' : ''}`} />
                </button>
                <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-chefGreen">{selectedCookbookRecipe.category}</span>
                <h2 className="text-5xl sm:text-8xl font-bold text-white serif italic leading-tight">{selectedCookbookRecipe.title}</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                <div className="space-y-8">
                  <h3 className="text-[12px] font-bold uppercase tracking-widest text-chefGreen/60 flex items-center gap-4">
                    <span className="w-8 h-px bg-chefGreen/40"></span> Ingredients
                  </h3>
                  <ul className="space-y-5">
                    {selectedCookbookRecipe.ingredients.map((ing, i) => <li key={i} className="text-white/80 text-2xl serif italic flex items-start gap-5"><Circle className="w-2.5 h-2.5 fill-chefGreen text-chefGreen mt-3 shrink-0" /> {ing}</li>)}
                  </ul>
                </div>
                <div className="space-y-8">
                  <h3 className="text-[12px] font-bold uppercase tracking-widest text-chefGreen/60 flex items-center gap-4">
                    <span className="w-8 h-px bg-chefGreen/40"></span> The Process
                  </h3>
                  <div className="space-y-10">
                    {selectedCookbookRecipe.instructions.map((step, i) => (
                      <div key={i} className="flex gap-8">
                        <span className="text-chefGreen font-bold text-3xl serif italic mt-1">{i + 1}.</span>
                        <p className="text-white/90 text-2xl serif italic leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Added Guide Me Through button at bottom of cookbook detail section */}
              <div className="pt-20 border-t border-white/5 flex flex-col items-center">
                 <button 
                  onClick={() => startGuideForCookbook(selectedCookbookRecipe)}
                  disabled={isApiKeyMissing}
                  className="group relative flex items-center gap-6 px-16 py-8 bg-white hover:bg-chefGreen text-chefGreen hover:text-white rounded-[3rem] shadow-3xl transition-all hover:scale-105 active:scale-95 overflow-hidden ring-4 ring-white/20 disabled:opacity-50"
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                   <Compass className="w-10 h-10 group-hover:rotate-45 transition-transform duration-700" />
                   <div className="text-left">
                     <span className="block text-[10px] font-bold uppercase tracking-[0.4em] mb-1 opacity-50">Interactive Mode</span>
                     <span className="text-2xl font-bold uppercase tracking-widest">Guide Me Through</span>
                   </div>
                   <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                 </button>
                 <p className="mt-8 text-white/30 text-xs font-medium italic tracking-widest uppercase">Immersive step-by-step visual mentorship</p>
              </div>
            </div>
          </div>
        ) : view === 'guide' && activeGuideData ? (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 max-w-4xl mx-auto pb-40 space-y-12">
             <StickyBackButton onClick={handleGoBack} />
             <div className="space-y-4 text-center">
                <h2 className="text-white/20 text-sm font-bold uppercase tracking-[0.4em]">Interactive Journey</h2>
                <h3 className="text-white text-5xl sm:text-7xl font-bold serif italic leading-tight">{activeGuideData.name}</h3>
                <div className="flex items-center justify-center gap-4 pt-4">
                  <div className="h-1.5 w-48 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-chefGreen transition-all duration-700" 
                      style={{ width: `${(completedSteps.length / activeGuideData.instructions.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-chefGreen text-[10px] font-bold uppercase tracking-widest">
                    {completedSteps.length} of {activeGuideData.instructions.length} Stages
                  </span>
                </div>
             </div>

             <div className="space-y-16">
               {activeGuideData.instructions.map((step, i) => (
                 <div 
                   key={i} 
                   onClick={() => toggleStep(i)}
                   className={`bg-white/[0.03] backdrop-blur-3xl p-10 sm:p-14 rounded-[3.5rem] border border-white/5 shadow-3xl transition-all group relative cursor-pointer ${completedSteps.includes(i) ? 'opacity-40 grayscale-[0.5] scale-[0.98]' : 'hover:scale-[1.01] hover:ring-1 ring-white/10'}`}
                 >
                   {completedSteps.includes(i) && (
                     <div className="absolute top-8 right-8 animate-in zoom-in">
                       <CheckCircle2 className="w-10 h-10 text-chefGreen shadow-glow rounded-full bg-white" />
                     </div>
                   )}
                   <div className="space-y-10">
                      <div className="flex gap-8 items-start">
                        <span className="text-chefGreen font-bold text-4xl sm:text-6xl serif italic mt-2 opacity-40">{i + 1}.</span>
                        <p className="text-white text-2xl sm:text-3xl serif italic leading-relaxed flex-1">{step}</p>
                      </div>
                      {activeGuideData.images?.[i] ? (
                        <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl group-hover:shadow-glow transition-all ring-1 ring-white/10">
                          <img src={activeGuideData.images[i]} className="w-full h-auto aspect-video object-cover" alt={`Visual for stage ${i+1}`} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-black/20 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-white/5 border border-white/5">
                           <Loader2 className="w-8 h-8 animate-spin" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Visualizing technique...</span>
                        </div>
                      )}
                   </div>
                 </div>
               ))}
             </div>

             {completedSteps.length === activeGuideData.instructions.length && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-700 bg-chefGreen/20 backdrop-blur-3xl p-16 rounded-[4rem] border border-chefGreen/40 text-center space-y-8 shadow-glow">
                   <div className="relative inline-block">
                     <Trophy className="w-24 h-24 text-chefGreen mx-auto animate-bounce" />
                     <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-white animate-pulse" />
                   </div>
                   <div className="space-y-4">
                     <h4 className="text-white text-4xl sm:text-6xl font-bold serif italic">Composition Complete</h4>
                     <p className="text-white/60 text-lg serif italic max-w-xl mx-auto">"The harmony is set. May this creation provide the comfort your spirit deserves."</p>
                   </div>
                   <button onClick={handleGoBack} className="px-10 py-5 bg-white text-chefGreen rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-2xl">Return to Studio</button>
                </div>
             )}
          </div>
        ) : view === 'collection' ? (
          <div className="animate-in fade-in slide-in-from-left-8 duration-700 max-w-6xl mx-auto pb-40 space-y-12">
             <StickyBackButton onClick={() => setView('home')} />
             <h2 className="text-4xl sm:text-7xl font-bold text-white serif italic border-b border-white/5 pb-10">The Collection</h2>
             {savedRecipes.length === 0 ? (
               <div className="py-52 text-center space-y-6">
                 <Bookmark className="w-16 h-16 text-white/5 mx-auto" />
                 <p className="text-white/20 text-3xl serif italic">Your gallery is currently empty.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                 {savedRecipes.map((recipe, idx) => {
                   const name = getRecipeName(recipe);
                   const isAIGenerated = !(recipe as CookbookRecipe).id;
                   const imageUrl = (recipe as Recommendation).imageUrl;
                   const prepTime = (recipe as Recommendation).prepTime || "25 mins";
                   const subtitle = isAIGenerated ? (recipe as Recommendation).moodExplanation : (recipe as CookbookRecipe).preview;

                   return (
                     <div 
                       key={idx} 
                       className="bg-white/[0.03] backdrop-blur-2xl rounded-[3.5rem] border border-white/10 overflow-hidden hover:border-chefGreen/40 shadow-xl hover:shadow-glow hover:-translate-y-4 transition-all group h-full flex flex-col ring-1 ring-white/5"
                     >
                        <div className="aspect-[4/3] relative overflow-hidden bg-black/20">
                          {imageUrl ? (
                            <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/5">
                              <ChefHat className="w-16 h-16" />
                            </div>
                          )}
                          <div className="absolute top-6 left-6"><PrepTimeBadge time={prepTime} compact /></div>
                          {!isAIGenerated && <div className="absolute top-6 right-6 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[8px] font-bold text-white uppercase tracking-widest border border-white/10">Cookbook</div>}
                        </div>
                        <div className="p-10 space-y-5 flex-1 flex flex-col">
                          <h4 className="text-white text-3xl font-bold serif italic leading-tight">{name}</h4>
                          <p className="text-white/40 text-base italic serif leading-relaxed flex-1 line-clamp-3">"{subtitle}"</p>
                          <div className="pt-8 flex gap-4">
                             <button onClick={() => loadSavedRecipe(recipe)} className="flex-1 py-5 bg-white text-chefGreen hover:bg-chefGreen hover:text-white rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl">Prepare Dish</button>
                             <button onClick={() => toggleSaveRecipe(recipe)} className="p-5 bg-red-900/10 text-red-400 rounded-[1.5rem] hover:bg-red-900/40 transition-all ring-1 ring-red-900/20"><Trash2 className="w-6 h-6" /></button>
                          </div>
                        </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        ) : recommendation && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 max-w-5xl mx-auto pb-40">
            <StickyBackButton onClick={handleGoBack} />
            <div className="bg-white/5 backdrop-blur-[40px] rounded-[4rem] shadow-3xl overflow-hidden border border-white/10 mt-6 ring-1 ring-white/5">
              <div className="relative h-[450px] sm:h-[650px] w-full">
                {recommendation.imageUrl ? <img src={recommendation.imageUrl} className="w-full h-full object-cover" alt={recommendation.dishName} /> : <div className="w-full h-full bg-black/20 flex items-center justify-center text-white/10"><Utensils className="w-24 h-24" /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent flex flex-col justify-end p-12 sm:p-20">
                  <div className="flex justify-between items-end">
                    <div className="space-y-6">
                      <span className="px-8 py-3 bg-chefGreen rounded-full text-[11px] font-bold text-white uppercase tracking-widest shadow-2xl">{recommendation.energyMatch}</span>
                      <h2 className="text-5xl sm:text-8xl font-bold text-white serif italic leading-none">{recommendation.dishName}</h2>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleSaveRecipe(recommendation); }} 
                      className={`p-6 rounded-full border transition-all active:scale-90 shadow-2xl ${isRecipeSaved(recommendation.dishName) ? 'bg-chefGreen text-white border-chefGreen shadow-glow' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                    >
                      <Heart className={`w-8 h-8 ${isRecipeSaved(recommendation.dishName) ? 'fill-white' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-12 sm:p-24 space-y-24">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.7em] text-chefGreen italic">The Resonance</h3>
                  <p className="text-white/80 text-4xl sm:text-6xl serif italic font-light leading-relaxed">"{recommendation.moodExplanation}"</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                  <div className="space-y-10">
                    <h3 className="text-[12px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-4">
                      <Utensils className="w-5 h-5 text-chefGreen" /> <span className="w-12 h-px bg-white/10"></span> THE ESSENCES
                    </h3>
                    <ul className="space-y-6">
                      {recommendation.keyIngredients.map((ing, i) => <li key={i} className="flex items-center gap-6 text-white/80 italic serif text-2xl"><Circle className="w-2.5 h-2.5 text-chefGreen fill-chefGreen" /> {ing}</li>)}
                    </ul>
                  </div>
                  <div className="space-y-10">
                    <h3 className="text-[12px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-4">
                      <BookOpen className="w-5 h-5 text-chefGreen" /> <span className="w-12 h-px bg-white/10"></span> THE COMPOSITION
                    </h3>
                    <div className="space-y-16">
                      {recommendation.instructions.map((step, i) => (
                        <div key={i} className="space-y-8">
                          <div className="flex gap-6">
                            <span className="text-chefGreen font-bold text-3xl serif italic mt-1">{i + 1}.</span>
                            <p className="text-white text-2xl serif italic leading-relaxed">{step}</p>
                          </div>
                          {recommendation.stepImages?.[i] && (
                            <div className="relative group">
                              <div className="absolute inset-0 bg-chefGreen/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <img src={recommendation.stepImages[i]} className="relative z-10 w-full h-64 object-cover rounded-[2.5rem] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 ring-1 ring-white/10" alt={`Step ${i+1}`} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
