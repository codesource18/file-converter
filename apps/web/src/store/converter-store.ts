import { create } from 'zustand';
import { 
  FileMetadata, 
  SmartRecommendationResult, 
  ToolDefinition, 
  ProcessedResult, 
  ProcessingProgress, 
  RecentActivityItem 
} from '@fileconverter/shared-types';

interface ConverterState {
  // File state
  files: File[];
  activeFile: File | null;
  activeMetadata: FileMetadata | null;
  recommendations: SmartRecommendationResult | null;
  
  // Processing state
  isProcessing: boolean;
  progress: ProcessingProgress;
  activeTool: ToolDefinition | null;
  result: ProcessedResult | null;
  error: string | null;

  // View state
  activeView: 'home' | 'editor' | 'batch' | 'workflow' | 'ocr' | 'qr' | 'compare' | 'tool-page';
  isSearchOpen: boolean;
  isRecentOpen: boolean;
  recentActivity: RecentActivityItem[];
  selectedCategory: string;
  theme: 'light' | 'dark';

  // Actions
  setFiles: (files: File[]) => void;
  setActiveFile: (file: File | null) => void;
  setActiveMetadata: (meta: FileMetadata | null) => void;
  setRecommendations: (rec: SmartRecommendationResult | null) => void;
  setActiveTool: (tool: ToolDefinition | null) => void;
  setIsProcessing: (val: boolean) => void;
  setProgress: (prog: ProcessingProgress) => void;
  setResult: (res: ProcessedResult | null) => void;
  setError: (err: string | null) => void;
  setActiveView: (view: 'home' | 'editor' | 'batch' | 'workflow' | 'ocr' | 'qr' | 'compare' | 'tool-page') => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsRecentOpen: (open: boolean) => void;
  addRecentActivity: (item: Omit<RecentActivityItem, 'id' | 'timestamp'>) => void;
  clearRecentActivity: () => void;
  setSelectedCategory: (cat: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  reset: () => void;
}

export const useConverterStore = create<ConverterState>((set, get) => ({
  files: [],
  activeFile: null,
  activeMetadata: null,
  recommendations: null,
  isProcessing: false,
  progress: { stage: 'idle', percent: 0, message: '' },
  activeTool: null,
  result: null,
  error: null,
  activeView: 'home',
  isSearchOpen: false,
  isRecentOpen: false,
  recentActivity: [],
  selectedCategory: 'all',
  theme: 'dark',

  setFiles: (files) => set({ files }),
  setActiveFile: (file) => set({ activeFile: file }),
  setActiveMetadata: (meta) => set({ activeMetadata: meta }),
  setRecommendations: (rec) => set({ recommendations: rec }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setIsProcessing: (val) => set({ isProcessing: val }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  setActiveView: (activeView) => set({ activeView }),
  setIsSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setIsRecentOpen: (isRecentOpen) => set({ isRecentOpen }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.scheme = theme;
      try {
        localStorage.setItem('fc-theme', theme);
      } catch (e) {}
    }
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.dataset.scheme = nextTheme;
      try {
        localStorage.setItem('fc-theme', nextTheme);
      } catch (e) {}
    }
    set({ theme: nextTheme });
  },

  addRecentActivity: (item) => {
    const newItem: RecentActivityItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };
    set((state) => ({
      recentActivity: [newItem, ...state.recentActivity].slice(0, 20)
    }));
  },

  clearRecentActivity: () => set({ recentActivity: [] }),

  reset: () => set({
    files: [],
    activeFile: null,
    activeMetadata: null,
    recommendations: null,
    isProcessing: false,
    progress: { stage: 'idle', percent: 0, message: '' },
    activeTool: null,
    result: null,
    error: null,
    activeView: 'home'
  })
}));
