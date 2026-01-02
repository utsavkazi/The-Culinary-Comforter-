
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Mood, Budget, Recommendation, User, CookbookRecipe } from './types';
import { getChefRecommendation, generateAudioNarration, generateMainImage, generateStepImage } from './geminiService';
import { COUNTRIES } from './countries';
import { COOKBOOK_RECIPES } from './cookbookData';
import { GoogleGenAI } from "@google/genai";
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
  Globe,
  ChevronDown,
  Search,
  LogOut,
  Moon,
  Sun,
  Share2,
  Check,
  ChevronLeft,
  Volume2,
  Pause,
  Square,
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
  Mail,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Library,
  Bot,
  Sparkle,
  History,
  GraduationCap,
  ScrollText,
  Stamp,
  User as UserIcon,
  ShieldAlert,
  Ban
} from 'lucide-react';

// Audio Utility Functions
function decodeBase64(base64: string) {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Failed to decode base64 audio", e);
    return new Uint8Array(0);
  }
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const MOOD_OPTIONS = [
  { value: Mood.STRESSED, icon: <AlertCircle className="w-5 h-5" />, label: "Stressed" },
  { value: Mood.ENERGETIC, icon: <Zap className="w-5 h-5" />, label: "Energetic" },
  { value: Mood.SAD, icon: <CloudRain className="w-5 h-5" />, label: "Sad" },
  { value: Mood.HAPPY, icon: <Smile className="w-5 h-5" />, label: "Happy" },
  { value: Mood.TIRED, icon: <Battery className="w-5 h-5" />, label: "Tired" },
  { value: Mood.ANXIOUS, icon: <Heart className="w-5 h-5" />, label: "Anxious" },
];

const BUDGET_OPTIONS = [
  { value: Budget.LOW, label: "Economical ($)" },
  { value: Budget.MID, label: "Moderate ($$)" },
  { value: Budget.HIGH, label: "Premium ($$$)" },
  { value: Budget.UNDECIDED, label: "Not Decided" },
];

const DIETARY_OPTIONS = [
  "Vegan", "Vegetarian", "Pescetarian", "Gluten-Free", "Dairy-Free", "Keto", "Paleo"
];

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

const STORAGE_KEY = 'culinary_comforter_user_profile';
const SAVED_RECIPES_KEY = 'culinary_comforter_saved_recipes';

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
            
            {/* Improved steam rising from the hat with more particles and variety */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-full flex justify-center pointer-events-none">
              <div className="relative w-24 h-32">
                <div className="steam-line animate-steam left-[10%] [animation-delay:0.2s]"></div>
                <div className="steam-line animate-steam left-[25%] [animation-delay:1.1s]"></div>
                <div className="steam-line animate-steam left-[45%] [animation-delay:2.4s]"></div>
                <div className="steam-line animate-steam left-[65%] [animation-delay:0.7s]"></div>
                <div className="steam-line animate-steam left-[85%] [animation-delay:1.8s]"></div>
                <div className="steam-line animate-steam left-[35%] [animation-delay:3.1s]"></div>
                <div className="steam-line animate-steam left-[55%] [animation-delay:0s]"></div>
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

const PrepTimeBadge: React.FC<{ time: string, compact?: boolean }> = ({ time, compact }) => {
  return (
    <div className={`relative group flex items-center gap-2 rounded-2xl backdrop-blur-md animate-simmer animate-glow-pulse transition-all overflow-hidden ${compact ? 'px-3 py-1.5 text-[9px]' : 'bg-white/10 px-6 py-3 text-sm'} border border-white/10 shadow-lg`}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="steam-line animate-steam left-[15%] [animation-delay:0s]"></div>
        <div className="steam-line animate-steam left-[35%] [animation-delay:0.8s]"></div>
        <div className="steam-line animate-steam left-[55%] [animation-delay:1.5s]"></div>
        <div className="steam-line animate-steam left-[75%] [animation-delay:2.2s]"></div>
        <div className="steam-line animate-steam left-[90%] [animation-delay:0.4s]"></div>
      </div>
      <div className="relative z-10 flex items-center gap-2">
        <Clock className={`${compact ? 'w-3 h-3' : 'w-5 h-5'} transition-transform group-hover:rotate-12 text-white/80`} />
        <span className="font-bold uppercase tracking-[0.2em] text-white whitespace-nowrap">{time || "20 mins"}</span>
      </div>
    </div>
  );
};

const cookbookToRecommendation = (recipe: CookbookRecipe): Recommendation => ({
  dishName: recipe.title,
  energyMatch: "Archive Selection",
  moodExplanation: recipe.preview,
  estimatedCost: "Heritage Pricing",
  keyIngredients: recipe.ingredients,
  instructions: recipe.instructions,
  bestFor: recipe.category,
  prepTime: "Varies",
  chefTip: `A secret from the archives of ${recipe.author}.`,
  imageUrl: `https://picsum.photos/seed/${encodeURIComponent(recipe.title)}/1200/800`
});

export default function App() {
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && parsed.fullName) return parsed;
    } catch {}
    return {
      fullName: 'Guest Chef',
      email: 'guest@culinarycomforter.com',
      age: 30,
      nationality: 'Global Citizen',
      dietaryPreferences: [],
      allergies: ''
    };
  });

  const [view, setView] = useState<'home' | 'result' | 'collection' | 'cookbook' | 'cookbook-detail'>('home');
  const [prevView, setPrevView] = useState<'home' | 'collection' | 'cookbook' | null>(null);
  const [mood, setMood] = useState<Mood | null>(Mood.HAPPY);
  const [budget, setBudget] = useState<Budget>(Budget.MID);
  const [context, setContext] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Home view local session states for preferences
  const [dietary, setDietary] = useState<string[]>(user.dietaryPreferences || []);
  const [allergies, setAllergies] = useState(user.allergies || '');

  // Cookbook Section State
  const [cookbookSearch, setCookbookSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [selectedCookbookRecipe, setSelectedCookbookRecipe] = useState<CookbookRecipe | null>(null);

  const [savedRecipes, setSavedRecipes] = useState<Recommendation[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_RECIPES_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(savedRecipes));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }, [savedRecipes]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear your collection?")) {
      setSavedRecipes([]);
      setIsMenuOpen(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
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
        } catch (e) { console.error("Main image failed", e); }
        
        const insts = result.instructions || [];
        for (let i = 0; i < Math.min(insts.length, 4); i++) {
          try {
            await new Promise(r => setTimeout(r, 800)); 
            const stepUrl = await generateStepImage(insts[i], result.dishName);
            setRecommendation(prev => {
              if (!prev) return null;
              const newStepImages = [...(prev.stepImages || new Array(insts.length).fill(""))];
              newStepImages[i] = stepUrl;
              return { ...prev, stepImages: newStepImages };
            });
          } catch (e) { console.error(`Step ${i} image failed`, e); }
        }
      })();
    } catch (err) {
      setError("The kitchen is currently overwhelmed. Please try again.");
      setLoading(false);
    }
  };

  const toggleSaveRecipe = (recipe: Recommendation | null) => {
    if (!recipe || !recipe.dishName) return;
    setSavedRecipes(prev => {
      const exists = prev.some(r => r.dishName === recipe.dishName);
      if (exists) return prev.filter(r => r.dishName !== recipe.dishName);
      return [...prev, { ...recipe }];
    });
  };

  const isRecipeSaved = (dishName: string | undefined) => {
    if (!dishName) return false;
    return savedRecipes.some(r => r && r.dishName === dishName);
  };

  const handleShare = async () => {
    if (!recommendation) return;
    const shareText = `🍳 Recommendation from The Culinary Comforter: ${recommendation.dishName}`;
    if (navigator.share) {
      try { await navigator.share({ title: recommendation.dishName, text: shareText, url: window.location.href }); } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {}
    }
  };

  const handlePlayAudio = async (targetRecommendation?: Recommendation) => {
    const activeRecommendation = targetRecommendation || recommendation;
    if (!activeRecommendation || !user) return;

    if (isPlaying) {
      if (audioContextRef.current) {
        if (audioContextRef.current.state === 'running') {
          await audioContextRef.current.suspend();
          setIsPaused(true);
        } else {
          await audioContextRef.current.resume();
          setIsPaused(false);
        }
      }
      return;
    }

    setAudioLoading(true);
    try {
      const base64Audio = await generateAudioNarration(activeRecommendation, user.fullName);
      if (!audioContextRef.current) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      }
      const rawData = decodeBase64(base64Audio);
      if (rawData.length === 0) throw new Error("Audio decoding failed");
      const audioBuffer = await decodeAudioData(rawData, audioContextRef.current!, 24000, 1);
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current!.destination);
      source.onended = () => { setIsPlaying(false); setIsPaused(false); };
      audioSourceRef.current = source;
      source.start();
      setIsPlaying(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Audio error:", err);
      window.alert("Audio narration is currently unavailable. Please check your connection.");
    } finally { setAudioLoading(false); }
  };

  const stopAudio = async () => {
    if (audioSourceRef.current) { 
      try { audioSourceRef.current.stop(); } catch(e) {}
      audioSourceRef.current = null; 
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try { await audioContextRef.current.resume(); } catch(e) {}
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleReturnHome = () => { 
    stopAudio(); 
    setCompletedSteps([]); 
    setPrevView(null); 
    setView('home'); 
    setIsMenuOpen(false); 
    setSelectedCookbookRecipe(null);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleGoBack = () => {
    stopAudio();
    if (view === 'result' && prevView === 'collection') {
      setView('collection');
      setPrevView('home');
    } else if (view === 'collection' || view === 'cookbook') {
      setView('home');
      setPrevView(null);
    } else if (view === 'cookbook-detail') {
      setView('cookbook');
      setSelectedCookbookRecipe(null);
    } else {
      handleReturnHome();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadSavedRecipe = (recipe: Recommendation) => {
    stopAudio();
    setRecommendation(recipe);
    setCompletedSteps([]);
    setPrevView('collection');
    setView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleStepCompletion = (index: number) => {
    setCompletedSteps(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const filteredCookbookRecipes = useMemo(() => {
    return COOKBOOK_RECIPES.filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(cookbookSearch.toLowerCase()) || 
                            recipe.ingredients.some(ing => ing.toLowerCase().includes(cookbookSearch.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [cookbookSearch, selectedCategory]);

  const categories = useMemo(() => ['All', ...new Set(COOKBOOK_RECIPES.map(r => r.category))], []);

  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case 'dessert': return <Sparkles className="w-4 h-4" />;
      case 'bread': return <Leaf className="w-4 h-4" />;
      case 'pasta': return <Utensils className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  const toggleDietary = (option: string) => {
    setDietary(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]);
  };

  // Persistent Sticky Back Button Component with reduced margin to header
  const StickyBackButton = () => (
    <div className="sticky top-[68px] sm:top-[76px] z-50 py-1 pointer-events-none">
      <button 
        onClick={handleGoBack} 
        className="pointer-events-auto flex items-center gap-2.5 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl text-white font-bold uppercase tracking-[0.2em] text-[9px] group border border-white/10 shadow-2xl transition-all"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
        Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-chefGreen dark:bg-chefGreen-dark transition-colors duration-500 pb-24 overflow-x-hidden">
      <LoadingOverlay isVisible={loading} />
      
      {/* Premium Header */}
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-chefGreen/80 dark:bg-chefGreen-dark/80 backdrop-blur-xl border-b border-white/10 py-5 sm:py-6 px-6 sm:px-10 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-5 cursor-pointer group" onClick={handleReturnHome}>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shadow-xl group-hover:scale-110 transition-transform text-white">
              <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 animate-bob-subtle" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white italic serif leading-none drop-shadow-lg">
                The Culinary Comforter
              </h1>
              <span className="text-[8px] uppercase tracking-[0.4em] font-bold text-white/40 mt-1 hidden sm:block">Aesthetic Personal Gastronomy</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 shadow-lg">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Slide-out Menu */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        <div onClick={() => setIsMenuOpen(false)} className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute top-0 right-0 h-full w-[260px] bg-stone-900/98 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/10 transition-transform duration-500 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="p-6 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-3 text-white">
              <ChefHat className="w-5 h-5 text-chefGreen" />
              <span className="text-lg font-bold serif italic">Studio Menu</span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <button onClick={handleReturnHome} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${view === 'home' ? 'bg-chefGreen text-white shadow-lg' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
              <Sparkles className="w-4 h-4" /><span className="text-md font-bold serif italic">Home Studio</span>
            </button>
            <button onClick={() => { setPrevView(view); setView('cookbook'); setIsMenuOpen(false); setSelectedCookbookRecipe(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${view === 'cookbook' ? 'bg-chefGreen text-white shadow-lg' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
              <Library className="w-4 h-4" /><span className="text-md font-bold serif italic">The Chef's Secret</span>
            </button>
            <button onClick={() => { setPrevView(view); setView('collection'); setIsMenuOpen(false); setSelectedCookbookRecipe(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${view === 'collection' ? 'bg-chefGreen text-white shadow-lg' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
              <Bookmark className="w-4 h-4" /><span className="text-md font-bold serif italic">Saved Recipes</span>
            </button>
            
            <div className="h-px bg-white/5 my-4 mx-2"></div>
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-chefGreen" /> : <Sun className="w-4 h-4 text-chefGreen" />}
                <span className="text-md font-bold serif italic">{theme === 'dark' ? 'Night Mode' : 'Day Mode'}</span>
              </div>
              <div className={`w-10 h-5 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-chefGreen' : 'bg-stone-700'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </button>
          </div>
          <div className="p-6 border-t border-white/5">
            <button onClick={handleClearData} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all font-bold uppercase tracking-widest text-[9px]"><Trash2 className="w-3.5 h-3.5" /> Clear Data</button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 sm:px-10 mt-36 sm:mt-40">
        {view === 'home' ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto space-y-12 pb-20">
            <div className="bg-white/10 backdrop-blur-xl p-8 sm:p-14 rounded-[3rem] border border-white/15 shadow-3xl space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-4xl sm:text-5xl font-bold text-white serif italic">The Culinary Studio</h2>
                <p className="text-white/50 text-lg font-medium italic leading-relaxed">"Describe your spirit, and let us compose a harmony for your table."</p>
              </div>
              <div className="space-y-10">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                    <MessageSquareQuote className="w-4 h-4 text-chefGreen" /> Inner Narrative
                  </h3>
                  <textarea 
                    value={context} 
                    onChange={(e) => {
                      setContext(e.target.value);
                      if (e.target.value.trim() !== "") {
                        setMood(null); // Clear mood selection when user gives narrative input
                      }
                    }} 
                    placeholder="Tell me of your day..." 
                    className="w-full h-32 p-6 rounded-3xl bg-black/20 text-white placeholder:text-white/15 border border-white/10 focus:ring-4 focus:ring-chefGreen/20 outline-none transition-all resize-none text-lg serif italic"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                      <Smile className="w-4 h-4 text-chefGreen" /> Vibration
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {MOOD_OPTIONS.map((opt) => (
                        <button 
                          key={opt.value} 
                          onClick={() => setMood(opt.value)} 
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${mood === opt.value ? 'bg-white text-[#016B61] border-transparent shadow-xl scale-105' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
                        >
                          <span className="mb-1 text-lg">{opt.icon}</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-chefGreen" /> Aura
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {BUDGET_OPTIONS.map((opt) => (
                        <button 
                          key={opt.value} 
                          onClick={() => setBudget(opt.value)} 
                          className={`py-5 rounded-2xl border transition-all duration-300 text-[8px] font-bold uppercase tracking-[0.2em] ${budget === opt.value ? 'bg-white text-[#016B61] border-transparent shadow-xl scale-105' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
                        >
                          {opt.value}
                        </button>
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
                          className={`px-4 py-2 rounded-full border text-[8px] font-bold uppercase tracking-widest transition-all ${dietary.includes(opt) ? 'bg-chefGreen text-white border-transparent' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                      <Ban className="w-4 h-4 text-chefGreen" /> Vital Protections (Allergies)
                    </h3>
                    <div className="relative">
                      <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        type="text" 
                        value={allergies} 
                        onChange={(e) => setAllergies(e.target.value)} 
                        placeholder="List any sensitivities..." 
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-black/20 text-white placeholder:text-white/15 border border-white/10 focus:ring-4 focus:ring-chefGreen/20 outline-none transition-all text-sm italic serif"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleGenerate} 
                disabled={loading} 
                className="w-full bg-white text-[#016B61] py-6 rounded-[2rem] font-bold text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 group mt-8"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
                Compose My Meal
              </button>
            </div>
          </div>
        ) : view === 'cookbook' ? (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 max-w-6xl mx-auto pb-40 space-y-4 relative">
            <StickyBackButton />
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl text-white shadow-xl backdrop-blur-xl border border-white/20"><ScrollText className="w-8 h-8" /></div>
                  <h2 className="text-4xl sm:text-5xl font-bold text-white serif italic tracking-tight">The Chef's Secret</h2>
                </div>
                <p className="text-white/40 text-xl italic max-w-2xl leading-relaxed">"Renaissance wisdom blended for the modern table."</p>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-4 sm:pb-0 no-scrollbar">
                {categories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap shadow-xl border ${selectedCategory === cat ? 'bg-white text-[#016B61] border-white' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-w-5xl mx-auto w-full pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                {filteredCookbookRecipes.map(recipe => (
                  <div 
                    key={recipe.id} 
                    onClick={() => { setSelectedCookbookRecipe(recipe); setCompletedSteps([]); setView('cookbook-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="group relative bg-white/5 backdrop-blur-[30px] border border-white/10 rounded-[2.5rem] p-8 space-y-6 cursor-pointer hover:bg-white/10 hover:border-white/20 hover:-translate-y-4 transition-all duration-500 shadow-xl flex flex-col h-full overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-6 flex flex-col items-center opacity-10 group-hover:opacity-40 transition-opacity">
                       <Stamp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                       <div className="p-3 bg-white/5 text-white rounded-xl shadow-inner border border-white/5 group-hover:scale-110 transition-transform">
                         {getCategoryIcon(recipe.category)}
                       </div>
                       <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">{recipe.category}</span>
                    </div>
                    <div className="space-y-3 relative z-10 flex-1">
                       <h3 className="text-2xl font-bold text-white serif italic leading-tight group-hover:text-chefGreen transition-colors">{recipe.title}</h3>
                       <div className="h-0.5 w-10 bg-chefGreen/20 rounded-full group-hover:w-20 transition-all"></div>
                       <p className="text-white/50 text-sm leading-relaxed italic serif line-clamp-3">"{recipe.preview}"</p>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 relative z-10">
                      <div className="flex items-center gap-3"><span className="italic serif opacity-40">p. {recipe.page}</span></div>
                      <div className="flex items-center gap-2 text-white/40 group-hover:text-white transition-colors">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Explore</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : view === 'cookbook-detail' && selectedCookbookRecipe ? (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 max-w-6xl mx-auto pb-40">
             <StickyBackButton />

              <div className="bg-white/5 backdrop-blur-[40px] rounded-[3.5rem] shadow-3xl overflow-hidden border border-white/10 p-10 sm:p-20 space-y-24">
                <div className="space-y-8">
                  <div className="flex flex-wrap gap-4 justify-center">
                    <span className="px-6 py-2 bg-chefGreen/90 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-[0.3em] shadow-lg border border-white/10">ARCHIVE SELECTION</span>
                    <span className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white/60 uppercase tracking-[0.3em] border border-white/10">{selectedCookbookRecipe.category}</span>
                  </div>
                  <h2 className="text-4xl sm:text-8xl font-bold text-white serif italic text-center leading-none">{selectedCookbookRecipe.title}</h2>
                  <div className="flex items-center justify-center gap-6 sm:gap-10">
                    <div className="flex items-center gap-3 text-white/40 text-[10px] font-bold uppercase tracking-[0.4em]"><History className="w-5 h-5 text-chefGreen" /> p. {selectedCookbookRecipe.page}</div>
                    <div className="flex items-center gap-3 text-white/40 text-[10px] font-bold uppercase tracking-[0.4em]"><UserIcon className="w-5 h-5 text-chefGreen" /> {selectedCookbookRecipe.author}</div>
                  </div>
                  <div className="flex justify-center gap-4 pt-8">
                    <button 
                      onClick={() => toggleSaveRecipe(cookbookToRecommendation(selectedCookbookRecipe))} 
                      className={`p-4 backdrop-blur-xl rounded-full transition-all active:scale-90 border shadow-lg ${isRecipeSaved(selectedCookbookRecipe.title) ? 'bg-chefGreen text-white border-chefGreen' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                    >
                      <Heart className={`w-5 h-5 ${isRecipeSaved(selectedCookbookRecipe.title) ? 'fill-white' : ''}`} />
                    </button>
                    <button 
                      onClick={() => handlePlayAudio(cookbookToRecommendation(selectedCookbookRecipe))} 
                      disabled={audioLoading} 
                      className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all active:scale-90 border border-white/20 shadow-lg disabled:opacity-50"
                    >
                      {audioLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? (isPaused ? <Play className="w-5 h-5 fill-white" /> : <Pause className="w-5 h-5 fill-white" />) : <Volume2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in duration-700">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.8em] text-chefGreen flex justify-center items-center gap-3"><Sparkles className="w-5 h-5" /> The Resonance</h3>
                  <p className="text-white/80 leading-relaxed text-3xl sm:text-5xl italic serif font-light">"{selectedCookbookRecipe.preview}"</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 pt-24 border-t border-white/10">
                  <div className="lg:col-span-5 space-y-16">
                    <div className="space-y-10">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30 flex items-center gap-4"><Utensils className="w-5 h-5 text-chefGreen" /> THE ESSENCES</h3>
                      <ul className="space-y-6">
                        {selectedCookbookRecipe.ingredients.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-6 text-white group">
                            <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-chefGreen text-[10px] flex items-center justify-center font-serif italic shadow-inner">{idx + 1}</span>
                            <span className="text-xl font-medium pt-0.5 italic serif opacity-80 group-hover:opacity-100 transition-opacity tracking-wide">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-16">
                    <div className="flex items-center justify-between gap-8 mb-12">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 flex items-center gap-4"><BookOpen className="w-5 h-5 text-chefGreen" /> THE COMPOSITION</h3>
                    </div>
                    <div className="space-y-16">
                      {selectedCookbookRecipe.instructions.map((step, idx) => {
                        const isDone = completedSteps.includes(idx);
                        return (
                          <div key={idx} className={`flex gap-10 items-start group cursor-pointer transition-all duration-500 ${isDone ? 'opacity-30' : ''}`} onClick={() => toggleStepCompletion(idx)}>
                            <div className="flex-shrink-0 relative w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-chefGreen flex items-center justify-center font-bold text-xl shadow-xl">
                              {idx + 1}
                              {isDone && <Check className="absolute -top-2 -right-2 w-6 h-6 bg-chefGreen text-white p-1 rounded-full shadow-lg" />}
                            </div>
                            <div className="flex-1 pt-2 space-y-4">
                              <p className={`leading-relaxed text-xl sm:text-2xl font-medium italic serif text-white transition-all duration-500 ${isDone ? 'line-through opacity-40' : ''}`}>{step}</p>
                              <div className={`h-[1px] w-16 transition-all duration-700 ${isDone ? 'bg-chefGreen w-full' : 'bg-white/5'}`}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
          </div>
        ) : view === 'collection' ? (
          <div className="animate-in fade-in slide-in-from-left-8 duration-700 max-w-6xl mx-auto pb-20">
            <StickyBackButton />
            <div className="space-y-12 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10 pb-10">
                 <div className="space-y-3">
                   <h2 className="text-4xl sm:text-6xl font-bold text-white serif italic leading-none">The Collection</h2>
                   <p className="text-white/40 text-lg font-medium italic">"A gallery of your personal resonances."</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <button onClick={handleReturnHome} className="px-6 py-3 bg-white text-[#016B61] rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"><Plus className="w-4 h-4" /> New Study</button>
                 </div>
              </div>
              {savedRecipes.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-700">
                  <div className="p-10 bg-white/5 border border-white/10 rounded-full text-white/10"><BookOpen className="w-16 h-16" /></div>
                  <h3 className="text-2xl text-white serif italic">Your collection is empty.</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {savedRecipes.map((recipe, idx) => (
                    <div key={idx} className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-chefGreen/40 hover:-translate-y-4 shadow-xl flex flex-col h-full">
                      <div className="aspect-[16/10] overflow-hidden relative">
                        {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.dishName} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                        <div className="absolute top-6 left-6"><PrepTimeBadge time={recipe.prepTime} compact /></div>
                        <div className="absolute bottom-6 left-6 right-6 space-y-1"><h4 className="text-white text-xl font-bold serif italic truncate">{recipe.dishName}</h4></div>
                      </div>
                      <div className="p-8 flex flex-col flex-1 space-y-6">
                        <p className="text-white/40 text-sm italic serif leading-relaxed line-clamp-3">"{recipe.moodExplanation}"</p>
                        <div className="flex gap-3 mt-auto pt-6 border-t border-white/5">
                          <button onClick={() => loadSavedRecipe(recipe)} className="flex-1 bg-white/5 hover:bg-white text-white hover:text-[#016B61] py-4 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">Prepare <ExternalLink className="w-3 h-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); setSavedRecipes(prev => prev.filter(r => r.dishName !== recipe.dishName)); }} className="p-4 bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-900/20 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 max-w-5xl mx-auto">
            <StickyBackButton />
            {recommendation && (
              <div className="bg-white/5 backdrop-blur-[40px] rounded-[3.5rem] shadow-3xl overflow-hidden border border-white/10 mt-4">
                <div className="relative h-[400px] sm:h-[600px] w-full overflow-hidden">
                  {recommendation.imageUrl && <img src={recommendation.imageUrl} alt={recommendation.dishName} className="w-full h-full object-cover animate-in fade-in duration-1000" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f1d] via-[#0a1f1d]/20 to-transparent flex flex-col justify-end p-10 sm:p-16">
                    <div className="flex justify-between items-start mb-10 gap-4">
                      <div className="flex flex-wrap gap-3"><span className="inline-block px-6 py-2 bg-chefGreen/90 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-[0.3em] shadow-lg">{recommendation.energyMatch}</span></div>
                      <div className="flex gap-4">
                        <button onClick={() => toggleSaveRecipe(recommendation)} className={`p-4 backdrop-blur-xl rounded-full transition-all active:scale-90 border shadow-lg ${isRecipeSaved(recommendation.dishName) ? 'bg-chefGreen text-white border-chefGreen' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}><Heart className={`w-6 h-6 ${isRecipeSaved(recommendation.dishName) ? 'fill-white' : ''}`} /></button>
                        <button onClick={() => handlePlayAudio()} disabled={audioLoading} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all active:scale-90 border border-white/20 shadow-lg disabled:opacity-50">{audioLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isPlaying ? (isPaused ? <Play className="w-6 h-6 fill-white" /> : <Pause className="w-6 h-6 fill-white" />) : <Volume2 className="w-6 h-6" />}</button>
                        <button onClick={handleShare} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all active:scale-90 border border-white/20 shadow-lg">{shared ? <Check className="w-6 h-6 text-green-400" /> : <Share2 className="w-6 h-6" />}</button>
                      </div>
                    </div>
                    <h2 className="text-4xl sm:text-7xl font-bold text-white serif italic leading-none mb-10 drop-shadow-2xl">{recommendation.dishName}</h2>
                    <div className="flex items-center gap-10 text-white/90 text-[10px] font-bold uppercase tracking-[0.3em]"><PrepTimeBadge time={recommendation.prepTime} /><span className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl backdrop-blur-xl border border-white/5 shadow-inner"><DollarSign className="w-5 h-5 text-chefGreen" /> {recommendation.estimatedCost}</span></div>
                  </div>
                </div>
                <div className="p-10 sm:p-20 space-y-32">
                  <div className="max-w-4xl mx-auto text-center space-y-10 animate-in fade-in duration-700">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.6em] text-chefGreen flex justify-center items-center gap-3"><Sparkles className="w-5 h-5" /> The Resonance</h3>
                    <p className="text-white/80 leading-relaxed text-3xl sm:text-5xl italic serif font-light">"{recommendation.moodExplanation}"</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 pt-24 border-t border-white/10">
                    <div className="lg:col-span-5 space-y-16">
                      <div className="space-y-10">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 flex items-center gap-4"><Utensils className="w-5 h-5 text-chefGreen" /> THE ESSENCES</h3>
                        <ul className="space-y-6">
                          {recommendation.keyIngredients.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-6 text-white group">
                              <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-chefGreen text-[10px] flex items-center justify-center font-serif italic shadow-inner">{idx + 1}</span>
                              <span className="text-xl font-medium pt-0.5 italic serif opacity-80 group-hover:opacity-100 transition-opacity">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="lg:col-span-7 space-y-16">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 flex items-center gap-4"><BookOpen className="w-5 h-5 text-chefGreen" /> THE COMPOSITION</h3>
                      </div>
                      <div className="space-y-16">
                        {recommendation.instructions.map((step, idx) => {
                          const isDone = completedSteps.includes(idx);
                          return (
                            <div key={idx} className={`flex flex-col sm:flex-row gap-10 items-start group cursor-pointer transition-all duration-500 ${isDone ? 'opacity-30 grayscale' : ''}`} onClick={() => toggleStepCompletion(idx)}>
                              <div className="sm:w-1/3 w-full flex-shrink-0 relative overflow-hidden rounded-[2rem] shadow-2xl border border-white/10 aspect-[4/3] bg-black/20">
                                {recommendation.stepImages?.[idx] && <img src={recommendation.stepImages[idx]} alt={`Step ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" />}
                                <div className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-[#0a1f1d] text-white flex items-center justify-center font-bold text-lg shadow-xl border border-white/10">{idx + 1}</div>
                                {isDone && <div className="absolute inset-0 bg-chefGreen/40 flex items-center justify-center animate-in zoom-in duration-300 backdrop-blur-sm"><CheckCircle2 className="w-16 h-16 text-white drop-shadow-xl" /></div>}
                              </div>
                              <div className="flex-1 pt-2 space-y-4">
                                <div className="flex items-start gap-5">
                                  <div className={`mt-1 flex-shrink-0 transition-all duration-500 ${isDone ? 'text-chefGreen scale-110' : 'text-white/10'}`}>{isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}</div>
                                  <p className={`leading-relaxed text-xl sm:text-2xl font-medium italic serif text-white transition-all duration-500 ${isDone ? 'line-through opacity-40' : ''}`}>{step}</p>
                                </div>
                                <div className={`h-[1px] w-16 transition-all duration-700 ${isDone ? 'bg-chefGreen w-full' : 'bg-white/5'}`}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-12 mt-40 text-center pb-24 opacity-20">
        <div className="flex justify-center items-center gap-5 mb-8 text-white">
          <ChefHat className="w-6 h-6" />
          <div className="w-16 h-[1px] bg-white/10"></div>
          <Heart className="w-6 h-6 text-chefGreen" />
          <div className="w-16 h-[1px] bg-white/10"></div>
          <Utensils className="w-6 h-6" />
        </div>
        <p className="text-white text-[10px] uppercase tracking-[0.6em] font-bold serif italic">"Whatever you're feeling, there's a flavor for that."</p>
      </footer>
    </div>
  );
}
