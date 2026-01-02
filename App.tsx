
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Mood, Budget, Recommendation, User } from './types';
import { getChefRecommendation, generateAudioNarration, generateMainImage, generateStepImage } from './geminiService';
import { COUNTRIES } from './countries';
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
  User as UserIcon,
  MapPin,
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
  ShieldCheck,
  Leaf,
  Settings2,
  Play,
  Bookmark,
  Trash2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Plus,
  Lock,
  Menu,
  X,
  ChevronRight
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

const DIETARY_TAGS = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Halal", "Keto", "Paleo", "Low Carb"];

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

const LOGIN_BACKGROUND_DISHES = [
  { url: "https://images.unsplash.com/photo-1544025162-d76694265947", label: "BBQ", pos: "top-[10%] left-[10%]", anim: "animate-float" },
  { url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", label: "Burger", pos: "top-[15%] right-[15%]", anim: "animate-float-delayed" },
  { url: "https://images.unsplash.com/photo-1513104890138-7c749659a591", label: "Pizza", pos: "bottom-[12%] left-[15%]", anim: "animate-float-delayed" },
  { url: "https://images.unsplash.com/photo-1601050633647-8f8f1f3c7d9a", label: "Pakora", pos: "bottom-[25%] right-[20%]", anim: "animate-float" },
  { url: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092", label: "Steak", pos: "top-[45%] left-[-5%]", anim: "animate-float" },
  { url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1", label: "Grill", pos: "bottom-[40%] right-[-5%]", anim: "animate-float-delayed" },
];

const STORAGE_KEY = 'culinary_comforter_user_profile';
const THEME_KEY = 'culinary_comforter_theme';
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
    <div className={`relative group flex items-center gap-2 rounded-2xl backdrop-blur-md animate-simmer transition-all ${compact ? 'px-2 py-1 text-[9px]' : 'bg-white/10 px-6 py-3 text-sm'}`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="steam-line animate-steam left-[20%] [animation-delay:0s]"></div>
        <div className="steam-line animate-steam left-[50%] [animation-delay:0.5s]"></div>
        <div className="steam-line animate-steam left-[80%] [animation-delay:1.2s]"></div>
      </div>
      <Clock className={`${compact ? 'w-3 h-3' : 'w-5 h-5'} transition-transform group-hover:rotate-12 text-white`} />
      <span className="font-bold uppercase tracking-[0.2em] text-white">{time || "20 mins"}</span>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === 'dark';
    } catch {
      return false;
    }
  });

  const [view, setView] = useState<'home' | 'result' | 'collection'>('home');
  const [prevView, setPrevView] = useState<'home' | 'collection' | null>(null);
  const [mood, setMood] = useState<Mood | null>(Mood.HAPPY);
  const [budget, setBudget] = useState<Budget>(Budget.MID);
  const [context, setContext] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [savedRecipes, setSavedRecipes] = useState<Recommendation[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_RECIPES_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [useDietary, setUseDietary] = useState(false);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState('');

  const toggleDietaryTag = (tag: string) => {
    setDietaryPreferences(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [loginForm, setLoginForm] = useState({
    fullName: '',
    password: '',
    age: '',
    nationality: 'Global Citizen',
    rememberMe: true,
    location: null as { latitude: number; longitude: number } | null
  });

  const [locationSynced, setLocationSynced] = useState(false);
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    try {
      const dataToSave = Array.isArray(savedRecipes) ? savedRecipes : [];
      localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }, [savedRecipes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNationalityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSyncLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoginForm(prev => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
          setLocationSynced(true);
        },
        (error) => {
          console.error("Geolocation error:", error);
          window.alert("We couldn't reach your location.");
        }
      );
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const newUser: User = {
        fullName: loginForm.fullName || "Chef Guest",
        age: parseInt(loginForm.age) || 25,
        nationality: loginForm.nationality,
        dietaryPreferences: [],
        allergies: '',
        location: loginForm.location || undefined
      };
      if (loginForm.rememberMe) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      }
      setUser(newUser);
      setLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SAVED_RECIPES_KEY);
      } catch {}
      stopAudio();
      setUser(null);
      setRecommendation(null);
      setSavedRecipes([]);
      setView('home');
      setContext('');
      setIsMenuOpen(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const requestUser: User = {
        ...user,
        dietaryPreferences: useDietary ? dietaryPreferences : [],
        allergies: useDietary ? allergies : ''
      };
      const result = await getChefRecommendation(mood, budget, requestUser, context);
      setRecommendation(result);
      setCompletedSteps([]);
      setPrevView(view);
      setView('result');
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Async image generation
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
      console.error(err);
      setLoading(false);
    }
  };

  const toggleSaveRecipe = (recipe: Recommendation | null) => {
    if (!recipe || !recipe.dishName) return;
    setSavedRecipes(prev => {
      const list = Array.isArray(prev) ? prev : [];
      const exists = list.some(r => r.dishName === recipe.dishName);
      if (exists) {
        return list.filter(r => r.dishName !== recipe.dishName);
      } else {
        return [...list, { ...recipe }];
      }
    });
  };

  const isRecipeSaved = (dishName: string | undefined) => {
    if (!dishName || !Array.isArray(savedRecipes)) return false;
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

  const handlePlayAudio = async () => {
    if (!recommendation || !user) return;
    
    // If already playing, handle pause/resume
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
      const base64Audio = await generateAudioNarration(recommendation, user.fullName);
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
      
      source.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      
      audioSourceRef.current = source;
      source.start();
      setIsPlaying(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Audio error:", err);
      window.alert("Audio narration is currently unavailable.");
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
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleGoBack = () => {
    stopAudio();
    if (view === 'result' && prevView === 'collection') {
      setView('collection');
      setPrevView('home');
    } else if (view === 'collection') {
      setView('home');
      setPrevView(null);
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

  const removeSavedRecipe = (e: React.MouseEvent, dishName: string) => {
    e.stopPropagation();
    setSavedRecipes(prev => Array.isArray(prev) ? prev.filter(r => r.dishName !== dishName) : []);
  };

  const toggleStepCompletion = (index: number) => {
    setCompletedSteps(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const progressPercentage = useMemo(() => {
    if (!recommendation || !Array.isArray(recommendation.instructions) || recommendation.instructions.length === 0) return 0;
    return (completedSteps.length / recommendation.instructions.length) * 100;
  }, [completedSteps, recommendation]);

  const filteredCountries = useMemo(() => COUNTRIES.filter(c => c.toLowerCase().includes(nationalitySearch.toLowerCase())), [nationalitySearch]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-chefGreen via-[#014d46] to-chefGreen-dark transition-colors relative overflow-hidden text-center sm:text-left">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-white/5 blur-[80px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full animate-pulse duration-[8s]"></div>
          
          {LOGIN_BACKGROUND_DISHES.map((dish, i) => (
            <div key={i} className={`dish-blob ${dish.pos} ${dish.anim} hidden md:block`}>
              <img 
                src={dish.url} 
                alt={dish.label} 
                className={`w-full h-full object-cover ${i % 2 === 0 ? 'animate-spin-slow' : 'animate-spin-reverse-slow'}`} 
              />
            </div>
          ))}
        </div>

        <div className="max-w-xl w-full bg-white/15 backdrop-blur-3xl rounded-[3.5rem] border border-white/25 shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-1000 z-10 flex flex-col">
          <div className="p-10 sm:p-14 text-center space-y-3">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-chefGreen/20 blur-xl rounded-full scale-150 group-hover:bg-chefGreen/30 transition-all duration-700"></div>
                <div className="relative p-6 bg-white/10 rounded-[2.5rem] border border-white/20 shadow-xl text-white">
                  <ChefHat className="w-12 h-12" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-stone-50 italic serif leading-tight drop-shadow-sm">Welcome to the Hearth</h1>
            <p className="text-stone-200/50 text-[11px] sm:text-xs uppercase tracking-[0.4em] font-bold mt-4 italic serif">Your Private Culinary Atelier</p>
          </div>
          <form onSubmit={handleLogin} className="px-10 sm:px-14 pb-14 space-y-8">
            <div className="relative group">
              <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/30 group-focus-within:text-stone-100 transition-colors" />
              <input required type="text" autoCapitalize="words" placeholder="What may we call you?" value={loginForm.fullName} onChange={e => setLoginForm({...loginForm, fullName: e.target.value})} className="w-full bg-white/5 border border-white/15 rounded-3xl h-20 pl-16 pr-8 text-white text-xl placeholder:text-stone-100/30 focus:bg-white/10 focus:ring-2 focus:ring-white/20 outline-none transition-all shadow-inner text-center sm:text-left" />
            </div>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/30 group-focus-within:text-stone-100 transition-colors" />
              <input required type="password" placeholder="Enter your secret key" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-white/5 border border-white/15 rounded-3xl h-16 pl-16 pr-8 text-white placeholder:text-stone-100/30 focus:bg-white/10 focus:ring-2 focus:ring-white/20 outline-none transition-all shadow-inner" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-200/60 ml-2">Years of Wisdom</label>
                <div className="relative group">
                  <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="number" placeholder="Age" value={loginForm.age} onChange={e => setLoginForm({...loginForm, age: e.target.value})} className="w-full bg-white/5 border border-white/15 rounded-2xl h-14 pl-12 pr-4 text-white placeholder:text-stone-100/30 outline-none focus:bg-white/10" />
                </div>
              </div>
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-200/60 ml-2">Heritage</label>
                <div onClick={() => setShowNationalityDropdown(!showNationalityDropdown)} className="w-full bg-white/5 border border-white/15 rounded-2xl h-14 pl-12 pr-10 text-white cursor-pointer flex items-center overflow-hidden transition-all hover:bg-white/10">
                  <Globe className="absolute left-5 w-4 h-4 text-white/30" /><span className="truncate">{loginForm.nationality}</span><ChevronDown className={`absolute right-4 w-4 h-4 text-white/30 transition-transform ${showNationalityDropdown ? 'rotate-180' : ''}`} />
                </div>
                {showNationalityDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-stone-900/95 backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-4 border-b border-white/10"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><input type="text" autoFocus placeholder="Search heritage..." value={nationalitySearch} onChange={e => setNationalitySearch(e.target.value)} onClick={e => e.stopPropagation()} className="w-full bg-white/10 border-none rounded-xl h-10 pl-10 pr-4 text-white text-sm outline-none" /></div></div>
                    <div className="max-h-52 overflow-y-auto custom-scrollbar">{filteredCountries.map(country => (<div key={country} onClick={(e) => { e.stopPropagation(); setLoginForm({...loginForm, nationality: country}); setShowNationalityDropdown(false); }} className="px-6 py-3 text-stone-200 hover:bg-chefGreen/40 cursor-pointer transition-colors text-sm">{country}</div>))}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
              <button type="button" onClick={handleSyncLocation} className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all active:scale-95 ${locationSynced ? 'bg-white/20 border-white/40 text-stone-100' : 'bg-transparent border-white/15 text-stone-100/60 hover:bg-white/5'}`}><MapPin className={`w-4 h-4 ${locationSynced ? 'text-chefGreen animate-pulse' : ''}`} /><span className="text-xs font-bold uppercase tracking-widest">{locationSynced ? "Location synced with the kitchen" : "Share your surroundings"}</span></button>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative"><input type="checkbox" checked={loginForm.rememberMe} onChange={e => setLoginForm({...loginForm, rememberMe: e.target.checked})} className="peer sr-only" /><div className="w-10 h-6 bg-white/10 rounded-full border border-white/20 peer-checked:bg-chefGreen transition-all"></div><div className="absolute top-1 left-1 w-4 h-4 bg-white/40 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-all"></div></div>
                <span className="text-xs font-bold uppercase tracking-widest text-stone-100/60 group-hover:text-stone-100 transition-colors">Remember Me</span>
              </label>
            </div>
            <div className="space-y-4 pt-4">
              <button type="submit" disabled={loading} className="w-full bg-[#0a2f2c] text-white py-6 rounded-3xl font-bold text-xl flex items-center justify-center gap-4 hover:bg-[#0d3b37] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] disabled:opacity-50">{loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Sparkles className="w-7 h-7" />}Enter the Studio</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chefGreen dark:bg-chefGreen-dark transition-colors duration-500 pb-24">
      <LoadingOverlay isVisible={loading} />
      
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-chefGreen/70 dark:bg-chefGreen-dark/70 backdrop-blur-[10px] border-b border-white/20 py-4 sm:py-5 px-6 sm:px-10 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-6 cursor-pointer group" onClick={handleReturnHome}>
            <div className="bg-white/10 p-3 rounded-[1.5rem] border border-white/10 shadow-2xl group-hover:scale-110 transition-transform text-white">
              <ChefHat className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white italic serif leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                The Culinary Comforter
              </h1>
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-white/40 mt-1 hidden sm:block">Aesthetic Personal Gastronomy</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end mr-2">
              <p className="text-white/30 text-[8px] uppercase font-bold tracking-[0.3em]">Chef In Residence</p>
              <p className="text-white font-bold serif text-xl sm:text-2xl italic leading-none mt-1">{user.fullName}</p>
            </div>
            <button onClick={() => setIsMenuOpen(true)} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 shadow-lg group">
              <Menu className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
        {view === 'result' && recommendation && (
          <div className="absolute bottom-0 left-0 h-[3px] bg-chefGreen/20 w-full overflow-hidden">
            <div className="h-full bg-chefGreen shadow-[0_0_10px_rgba(1,107,97,0.8)] transition-all duration-700 ease-out" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        )}
      </nav>

      <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        <div onClick={() => setIsMenuOpen(false)} className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute top-0 right-0 h-full w-[210px] sm:w-[240px] bg-stone-900/98 dark:bg-[#011412]/98 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/10 transition-transform duration-500 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="p-4 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-2 text-white">
              <ChefHat className="w-4 h-4 text-chefGreen" />
              <span className="text-base font-bold serif italic">Studio Menu</span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-all"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            <button onClick={handleReturnHome} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-[0.98] group ${view === 'home' ? 'bg-chefGreen text-white shadow-lg' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
              <Sparkles className={`w-4 h-4 ${view === 'home' ? 'text-white' : 'text-chefGreen'}`} /><span className="text-sm font-bold serif italic">Home Studio</span>
            </button>
            <button onClick={() => { setPrevView(view); setView('collection'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-[0.98] group ${view === 'collection' ? 'bg-chefGreen text-white shadow-lg' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
              <Bookmark className={`w-4 h-4 ${view === 'collection' ? 'text-white' : 'text-chefGreen'}`} /><div className="flex flex-col items-start"><span className="text-sm font-bold serif italic">Favourite Recipes</span><span className="text-[8px] uppercase tracking-widest opacity-40 font-bold">{Array.isArray(savedRecipes) ? savedRecipes.length : 0} Saved</span></div>
            </button>
            <div className="py-1.5 px-1"><div className="w-full h-[1px] bg-white/5"></div></div>
            <div className="px-1 space-y-2">
              <h4 className="text-[7px] uppercase tracking-[0.2em] font-bold text-white/20 px-1">Ambience</h4>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-2"><div className={`p-1 rounded-md transition-colors ${isDarkMode ? 'bg-stone-800 text-yellow-400' : 'bg-stone-100 text-chefGreen'}`}>{isDarkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}</div><span className="text-white font-bold serif text-xs italic">{isDarkMode ? 'Night' : 'Light'}</span></div>
                <div className={`w-8 h-4.5 rounded-full border transition-all relative ${isDarkMode ? 'bg-chefGreen border-chefGreen' : 'bg-white/10 border-white/20'}`}><div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isDarkMode ? 'left-4' : 'left-0.5'}`}></div></div>
              </button>
            </div>
          </div>
          <div className="p-4 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-red-400/80 hover:text-red-300 hover:bg-red-950/20 transition-all font-bold uppercase tracking-widest text-[8px]"><LogOut className="w-3.5 h-3.5" /> Sign Out</button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-32 sm:mt-40">
        {view === 'home' ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto space-y-12 pb-20">
            <div className="bg-white/10 dark:bg-stone-900/40 backdrop-blur-xl p-8 sm:p-16 rounded-[3rem] border border-white/20 dark:border-white/10 shadow-2xl space-y-16">
              <div className="text-center space-y-4 text-white">
                <h2 className="text-4xl sm:text-6xl font-bold serif italic">The Culinary Studio</h2>
                <p className="text-white/60 text-lg sm:text-xl font-medium max-w-2xl mx-auto italic">"Tell me of your day, your heart, and your harvest preference."</p>
              </div>
              <div className="space-y-12">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 dark:text-stone-300 mb-6 flex items-center gap-3"><MessageSquareQuote className="w-5 h-5 text-chefGreen-dark dark:text-chefGreen" /> Inner Narrative</h3>
                  <textarea value={context} onChange={(e) => { setContext(e.target.value); if (e.target.value.length > 0 && mood !== null) setMood(null); }} placeholder="Describe your current state..." className="w-full h-40 p-6 rounded-3xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 border-none focus:ring-8 focus:ring-chefGreen/20 outline-none transition-all resize-none shadow-inner text-lg" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 dark:text-stone-300 mb-6 flex items-center gap-3"><Smile className="w-5 h-5 text-chefGreen-dark dark:text-chefGreen" /> Current Vibration</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {MOOD_OPTIONS.map((opt) => (<button key={opt.value} onClick={() => setMood(opt.value)} className={`flex flex-col items-center justify-center p-5 rounded-3xl border transition-all ${mood === opt.value ? 'bg-white dark:bg-stone-100 text-stone-900 border-transparent shadow-2xl scale-105' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}><span className="mb-2">{opt.icon}</span><span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span></button>))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 dark:text-stone-300 mb-6 flex items-center gap-3"><DollarSign className="w-5 h-5 text-chefGreen-dark dark:text-chefGreen" /> Financial Aura</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {BUDGET_OPTIONS.map((opt) => (<button key={opt.value} onClick={() => setBudget(opt.value)} className={`py-6 rounded-3xl border transition-all text-xs font-bold ${budget === opt.value ? 'bg-white dark:bg-stone-100 text-stone-900 border-transparent shadow-xl' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>{opt.value}</button>))}
                    </div>
                  </div>
                </div>

                {/* Dietary & Allergy Section */}
                <div className="space-y-6 pt-6 border-t border-white/10">
                  <button 
                    onClick={() => setUseDietary(!useDietary)} 
                    className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 rounded-[2rem] border border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-all ${useDietary ? 'bg-chefGreen text-white' : 'bg-white/10 text-white/40'}`}>
                        <Leaf className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-white font-bold text-lg serif italic">Dietary Blueprint</h4>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Refine your physical requirements</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-6 h-6 text-white/20 transition-transform ${useDietary ? 'rotate-90' : ''}`} />
                  </button>

                  {useDietary && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500 p-2">
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 ml-2">Preferences</h3>
                        <div className="flex flex-wrap gap-2">
                          {DIETARY_TAGS.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => toggleDietaryTag(tag)}
                              className={`px-6 py-3 rounded-full border text-[11px] font-bold uppercase tracking-widest transition-all ${
                                dietaryPreferences.includes(tag)
                                  ? 'bg-chefGreen border-chefGreen text-white shadow-lg scale-105'
                                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 ml-2">Allergies & Sensitivities</h3>
                        <div className="relative group">
                          <AlertCircle className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-chefGreen transition-colors" />
                          <input 
                            type="text" 
                            placeholder="e.g., Peanuts, Shellfish, Strawberries..." 
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 text-white placeholder:text-white/20 focus:bg-white/10 focus:ring-2 focus:ring-chefGreen/40 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={handleGenerate} disabled={loading} className="w-full bg-stone-900 dark:bg-chefGreen text-white py-8 rounded-[2rem] font-bold text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"><Sparkles className="w-8 h-8" /> Illuminate My Palette</button>
              {error && <p className="text-red-200 text-xs text-center font-medium bg-red-900/40 p-4 rounded-2xl">{error}</p>}
            </div>
          </div>
        ) : view === 'collection' ? (
          <div className="animate-in fade-in slide-in-from-left-8 duration-700 max-w-6xl mx-auto pb-20">
            <div className="sticky top-[72px] sm:top-[80px] z-50 bg-chefGreen/80 dark:bg-chefGreen-dark/80 backdrop-blur-lg py-4 -mx-4 px-4 rounded-b-3xl border-b border-white/5 mb-8">
              <button onClick={handleGoBack} className="flex items-center gap-2.5 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white font-bold uppercase tracking-[0.2em] text-[10px] group border border-white/10 shadow-xl transition-all active:scale-95">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Studio
              </button>
            </div>
            <div className="space-y-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10 pb-12">
                 <div className="space-y-4"><h2 className="text-5xl sm:text-7xl font-bold text-white serif italic">The Private Collection</h2><p className="text-white/50 text-xl font-medium italic">"A library of comfort, curated specifically for your journey."</p></div>
                 <div className="flex items-center gap-4">
                    {Array.isArray(savedRecipes) && savedRecipes.length > 0 && (<button onClick={() => { if(window.confirm("Clear entire history?")) setSavedRecipes([]); }} className="px-6 py-3 bg-white/5 hover:bg-red-900/20 text-white/40 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">Reset Palette</button>)}
                    <button onClick={() => { setPrevView('collection'); setView('home'); }} className="px-8 py-3 bg-chefGreen text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"><Plus className="w-4 h-4" /> New Recommendation</button>
                 </div>
              </div>
              {!Array.isArray(savedRecipes) || savedRecipes.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-1000">
                  <div className="p-12 bg-white/5 border border-white/10 rounded-full text-white/10"><BookOpen className="w-20 h-20" /></div>
                  <div className="space-y-2"><h3 className="text-3xl text-white serif italic">Your collection is empty</h3><p className="text-white/40 font-medium">Begin your journey in the Studio.</p></div>
                  <button onClick={() => setView('home')} className="px-10 py-5 bg-white text-stone-900 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-2xl">Return to Studio</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {savedRecipes.map((recipe, idx) => {
                    if (!recipe) return null;
                    return (
                    <div key={idx} className="group relative bg-white/5 dark:bg-stone-900/40 border border-white/10 rounded-[3rem] overflow-hidden transition-all hover:border-chefGreen/40 hover:scale-[1.02] shadow-2xl flex flex-col h-full">
                      <div className="aspect-[16/10] overflow-hidden relative">
                        {recipe.imageUrl ? <img src={recipe.imageUrl} alt={recipe.dishName} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" /> : <div className="w-full h-full bg-stone-800 animate-pulse" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                        <div className="absolute top-6 left-6"><span className="px-4 py-1.5 bg-chefGreen/80 backdrop-blur-md rounded-full text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">{recipe.energyMatch || "Gourmet"}</span></div>
                        <div className="absolute bottom-6 left-6 right-6 space-y-1"><h4 className="text-white text-2xl font-bold serif italic truncate">{recipe.dishName}</h4><div className="flex gap-4 text-white/60 text-[9px] font-bold uppercase tracking-widest"><PrepTimeBadge time={recipe.prepTime} compact /> <span className="flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> {recipe.estimatedCost}</span></div></div>
                      </div>
                      <div className="p-8 flex flex-col flex-1 space-y-6"><p className="text-white/50 text-sm italic serif leading-relaxed line-clamp-3">"{recipe.moodExplanation}"</p><div className="flex gap-3 mt-auto pt-6 border-t border-white/5"><button onClick={() => loadSavedRecipe(recipe)} className="flex-1 bg-white/10 hover:bg-white text-white hover:text-stone-900 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn">Revisit Preparation <ExternalLink className="w-3 h-3 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" /></button><button onClick={(e) => removeSavedRecipe(e, recipe.dishName)} className="p-4 bg-red-900/10 hover:bg-red-900/30 text-red-300 border border-red-900/20 rounded-2xl transition-all active:scale-90"><Trash2 className="w-5 h-5" /></button></div></div>
                    </div>
                    )})}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-12 duration-1000 max-w-6xl mx-auto">
            <div className="sticky top-[72px] sm:top-[80px] z-50 bg-chefGreen/80 dark:bg-chefGreen-dark/80 backdrop-blur-lg py-4 -mx-4 px-4 rounded-b-3xl border-b border-white/5 mb-8 flex justify-between items-center">
              <button onClick={handleGoBack} className="flex items-center gap-2.5 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white font-bold uppercase tracking-[0.2em] text-[10px] group border border-white/10 shadow-xl transition-all active:scale-95">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                {prevView === 'collection' ? "Back to Collection" : "Back to Studio"}
              </button>
              <button onClick={() => { setPrevView('result'); setView('collection'); }} className="flex items-center gap-3 text-white/60 hover:text-white transition-colors font-bold uppercase tracking-[0.2em] text-xs group">
                View Collection <Bookmark className="w-4 h-4 ml-1" />
              </button>
            </div>
            {recommendation && (
              <div className="bg-white dark:bg-stone-900 rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] overflow-hidden border border-stone-100 dark:border-stone-800">
                <div className="relative h-[450px] sm:h-[650px] w-full overflow-hidden">
                  {recommendation.imageUrl ? (
                    <img src={recommendation.imageUrl} alt={recommendation.dishName} className="w-full h-full object-cover animate-in fade-in duration-700" />
                  ) : (
                    <div className="w-full h-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-chefGreen mx-auto" />
                        <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Visualizing Culinary Concept...</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/20 to-transparent flex flex-col justify-end p-10 sm:p-20">
                    <div className="flex justify-between items-start mb-8 gap-4">
                      <div className="flex flex-wrap gap-2"><span className="inline-block px-6 py-2 bg-chefGreen/90 backdrop-blur-md rounded-full text-[11px] font-bold text-white uppercase tracking-[0.2em] shadow-lg">{recommendation.energyMatch || "Gourmet"}</span></div>
                      <div className="flex gap-4">
                        <button onClick={() => toggleSaveRecipe(recommendation)} className={`p-4 backdrop-blur-md rounded-full transition-all active:scale-90 border flex items-center gap-3 shadow-xl ${isRecipeSaved(recommendation.dishName) ? 'bg-chefGreen text-white border-chefGreen' : 'bg-white/20 text-white border-white/20 hover:bg-white/30'}`}>
                          <Heart className={`w-6 h-6 ${isRecipeSaved(recommendation.dishName) ? 'fill-white' : ''}`} /><span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">{isRecipeSaved(recommendation.dishName) ? "Saved" : "Save"}</span>
                        </button>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={handlePlayAudio} 
                            disabled={audioLoading} 
                            className={`p-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all active:scale-90 border border-white/20 flex items-center gap-3 shadow-xl disabled:opacity-50 ${isPlaying && !isPaused ? 'ring-4 ring-chefGreen' : ''}`}
                          >
                            {audioLoading ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : isPlaying ? (
                              isPaused ? <Play className="w-6 h-6 fill-white" /> : <Pause className="w-6 h-6 fill-white" />
                            ) : (
                              <Volume2 className="w-6 h-6" />
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
                              {audioLoading ? "Preparing..." : isPlaying ? (isPaused ? "Resume" : "Pause") : "Listen"}
                            </span>
                          </button>
                          
                          {isPlaying && (
                            <button 
                              onClick={stopAudio} 
                              className="p-4 bg-white/20 hover:bg-red-500/40 backdrop-blur-md rounded-full text-white transition-all active:scale-90 border border-white/20 flex items-center gap-3 shadow-xl"
                            >
                              <Square className="w-6 h-6 fill-white" />
                              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Reset</span>
                            </button>
                          )}
                        </div>

                        <button onClick={handleShare} className="p-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all active:scale-90 border border-white/20 flex items-center gap-3 shadow-xl">{shared ? <Check className="w-6 h-6 text-green-400" /> : <Share2 className="w-6 h-6" />}<span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Share</span></button>
                      </div>
                    </div>
                    <h2 className="text-5xl sm:text-8xl font-bold text-white serif italic leading-tight mb-8 drop-shadow-2xl">{recommendation.dishName}</h2>
                    <div className="flex items-center gap-8 text-white/90 text-sm font-bold uppercase tracking-[0.2em]">
                      <PrepTimeBadge time={recommendation.prepTime} /><span className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md text-white"><DollarSign className="w-5 h-5" /> {recommendation.estimatedCost}</span>
                    </div>
                  </div>
                </div>
                <div className="p-10 sm:p-20 space-y-24">
                  <div className="max-w-4xl mx-auto text-center space-y-8"><h3 className="text-xs font-bold uppercase tracking-[0.3em] text-chefGreen flex justify-center items-center gap-3"><Sparkles className="w-5 h-5" /> The Chef's Resonance</h3><p className="text-stone-700 dark:text-stone-300 leading-relaxed text-3xl sm:text-5xl italic serif">"{recommendation.moodExplanation}"</p></div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 pt-20 border-t border-stone-50 dark:border-stone-800">
                    <div className="lg:col-span-5 space-y-12">
                      <div><h3 className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400 mb-10 flex items-center gap-3"><Utensils className="w-5 h-5" /> The Ingredients</h3><ul className="space-y-6">{Array.isArray(recommendation.keyIngredients) && recommendation.keyIngredients.map((item, idx) => (<li key={idx} className="flex items-start gap-5 text-stone-700 dark:text-stone-300 group"><span className="flex-shrink-0 w-8 h-8 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-100 text-stone-400 text-xs flex items-center justify-center font-bold">{idx + 1}</span><span className="text-xl font-medium pt-0.5">{item}</span></li>))}</ul></div>
                      <div className="bg-stone-50/50 dark:bg-stone-800/30 p-10 rounded-[2.5rem] border border-stone-100 dark:border-stone-800/50"><h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-4">Chef's Whisper</h3><p className="text-stone-600 dark:text-stone-400 text-xl italic leading-relaxed serif">"{recommendation.chefTip}"</p></div>
                    </div>
                    <div className="lg:col-span-7 space-y-12">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400 flex items-center gap-3 mb-2"><BookOpen className="w-5 h-5" /> The Preparation</h3>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-chefGreen">{completedSteps.length} of {Array.isArray(recommendation.instructions) ? recommendation.instructions.length : 0} stages complete</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={handlePlayAudio} 
                            disabled={audioLoading} 
                            className={`flex items-center gap-2 px-6 py-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300 hover:scale-105 transition-all shadow-md ${isPlaying && !isPaused ? 'ring-2 ring-chefGreen' : ''}`}
                          >
                            {audioLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isPlaying ? (
                              isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            {isPlaying ? (isPaused ? "Resume Guide" : "Pause Guide") : "Play Recipe Audio"}
                          </button>
                          
                          {isPlaying && (
                            <button 
                              onClick={stopAudio} 
                              className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-red-500 hover:bg-red-50 transition-all shadow-md"
                            >
                              <Square className="w-4 h-4 fill-current" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-20">
                        {Array.isArray(recommendation.instructions) && recommendation.instructions.map((step, idx) => {
                          const isDone = completedSteps.includes(idx);
                          return (
                            <div key={idx} className={`flex flex-col sm:flex-row gap-10 items-start group cursor-pointer transition-all duration-500 ${isDone ? 'opacity-40 grayscale-[50%]' : ''}`} onClick={() => toggleStepCompletion(idx)}>
                              <div className="sm:w-1/3 w-full flex-shrink-0 relative">
                                <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 shadow-xl">
                                    {Array.isArray(recommendation.stepImages) && recommendation.stepImages[idx] ? (
                                      <img src={recommendation.stepImages[idx]} alt={`Step ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 animate-in fade-in" />
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 dark:text-stone-600 space-y-3"><Loader2 className="w-6 h-6 animate-spin opacity-40" /><span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Visual Guide</span></div>
                                    )}
                                    <div className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center font-bold text-lg shadow-2xl">{idx + 1}</div>
                                    {isDone && (<div className="absolute inset-0 bg-chefGreen/20 flex items-center justify-center animate-in zoom-in duration-300"><CheckCircle2 className="w-16 h-16 text-white drop-shadow-lg" /></div>)}
                                </div>
                              </div>
                              <div className="flex-1 pt-2 space-y-4 text-stone-800 dark:text-stone-200"><div className="flex items-start gap-4"><div className={`mt-1.5 flex-shrink-0 transition-colors duration-300 ${isDone ? 'text-chefGreen' : 'text-stone-300'}`}>{isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}</div><p className={`leading-relaxed text-xl sm:text-2xl font-medium italic serif transition-all duration-500 ${isDone ? 'line-through decoration-chefGreen/40' : ''}`}>{step}</p></div><div className={`h-[1px] w-12 transition-all duration-700 ${isDone ? 'bg-chefGreen w-full' : 'bg-chefGreen/20'}`}></div></div>
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
      <footer className="max-w-7xl mx-auto px-10 mt-32 text-center pb-24 opacity-40"><div className="flex justify-center items-center gap-4 mb-8 text-white"><ChefHat className="w-6 h-6 flex-shrink-0" /><div className="w-12 h-[1px] bg-white/30"></div><Heart className="w-6 h-6 animate-pulse flex-shrink-0" /><div className="w-12 h-[1px] bg-white/30"></div><Utensils className="w-6 h-6 flex-shrink-0" /></div><p className="text-white text-sm uppercase tracking-[0.3em] font-bold serif italic">"Whatever you're feeling, there's a flavor for that."</p></footer>
    </div>
  );
}
