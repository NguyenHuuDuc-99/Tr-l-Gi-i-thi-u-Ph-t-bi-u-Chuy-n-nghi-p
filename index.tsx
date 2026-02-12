import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// --- Configuration ---
const SYSTEM_INSTRUCTION = `
## 1. IDENTITY & ROLE
**Role:** Master Speechwriter & Public Speaking Coach (Chuyên gia Soạn thảo & Huấn luyện Diễn thuyết).
**Specialization:** Hùng biện (Rhetoric), Tâm lý học đám đông, NLP & Kỹ thuật sân khấu.
**Mission:** Tạo ra những bài diễn văn có khả năng "dẫn dắt cảm xúc" (Emotional Navigation) và định hình phong cách người nói, biến ngôn từ thành sức mạnh.

## 2. OPERATIONAL LOGIC
Bạn phải tuân thủ quy trình tư duy xử lý (Chain-of-Thought) sau cho mọi yêu cầu:

1. **Step 1: ANALYZE** - Xác định Người nói (Who), Người nghe (Audience), Mục tiêu (Goal), Bối cảnh (Context).
2. **Step 2: STRATEGY** - Chọn Tone từ Tone Matrix và xác định cấu trúc (AIDA / Storytelling).
3. **Step 3: DRAFTING** - Viết nội dung, bắt buộc áp dụng: Ẩn dụ (Metaphor), Điệp từ (Repetition), Quy tắc số 3 (Rule of Three).
4. **Step 4: STAGING** - Chèn chỉ dẫn diễn xuất: [Ngưng], [Cười], [Nhấn mạnh], [Quét mắt], [Thở sâu].

**Tone Matrix:**
- "Solemn": Trang trọng, từ Hán Việt, câu phức (Hội nghị/Lễ kỷ niệm). Vocabulary: Formal, Latinate. Sentence Structure: Complex, periodic.
- "Inspiring": Mạnh mẽ, động từ mạnh, nhịp điệu dồn dập (Kickoff/Tranh cử). Vocabulary: Strong verbs, sensory words. Sentence Structure: Tricolon, anaphora.
- "Witty": Hài hước, chơi chữ, tự trào (Tiệc tùng/Bonding). Vocabulary: Playful, puns. Sentence Structure: Short, punchy, surprising twists.
- "Emotional": Chậm rãi, kể chuyện, giàu hình ảnh (Chia sẻ/Tri ân). Vocabulary: Evocative, personal. Sentence Structure: Looser, narrative flow.

**Constraints:**
- Formatting: Use Markdown. Bold keywords. Italicize stage directions in brackets e.g. *[Pause]*.
- Language: Follow the target language specified in the prompt.
`;

// --- Translations ---
const TRANSLATIONS = {
  en: {
    title: "V.A.I SPEECH MASTER",
    subtitle: "Ultimate Edition",
    navGenerator: "Generator",
    navLibrary: "Library",
    briefTitle: "The Brief",
    labelSpeaker: "Who is Speaking?",
    phSpeaker: "e.g. CEO, Best Man, Team Leader",
    labelAudience: "Audience",
    phAudience: "e.g. Shareholders, Family, Dev Team",
    labelGoal: "Goal",
    phGoal: "e.g. Persuade investors, Inspire action",
    labelContext: "Context",
    phContext: "Additional details: Annual gala, post-crisis meeting, wedding reception...",
    labelTone: "Tone Strategy",
    btnGenerate: "Generate Speech",
    btnGenerating: "Crafting Masterpiece...",
    stageTitle: "The Stage",
    btnStyle: "Style",
    btnEdit: "Edit Text",
    btnDone: "Done Editing",
    btnRehearse: "Rehearse",
    analysisTitle: "Rhetorical Analysis",
    scoreTitle: "Complexity Score",
    devicesTitle: "Rhetorical Devices Used",
    libTitle: "Speech Library",
    searchPlaceholder: "Search speeches...",
    emptyLib: "Your library is empty. Create your first masterpiece!",
    openSpeech: "Open Speech",
    errorRequired: "Please fill in the required fields (Speaker, Audience, Goal).",
    errorAudio: "No audio data received.",
    errorGenAudio: "Failed to generate audio.",
    errorGenSpeech: "Failed to generate speech.",
    placeholderStage: "\"The podium awaits your words...\"",
    tones: {
       Solemn: { label: "Solemn", desc: "Formal, Latinate vocabulary. Complex, periodic sentence structures. Grave & respectful mood." },
       Inspiring: { label: "Inspiring", desc: "Strong verbs, sensory words. Uses Tricolon & Anaphora. Energetic & hopeful mood." },
       Witty: { label: "Witty", desc: "Playful, puns, self-deprecating. Short, punchy sentences with twists. Lighthearted." },
       Emotional: { label: "Emotional", desc: "Evocative, personal vocabulary. Loose, narrative flow. Vulnerable & connecting." }
    }
  },
  vi: {
    title: "V.A.I SPEECH MASTER",
    subtitle: "Phiên bản Tối thượng",
    navGenerator: "Tạo bài nói",
    navLibrary: "Thư viện",
    briefTitle: "Hồ sơ",
    labelSpeaker: "Người nói là ai?",
    phSpeaker: "vd: CEO, Chú rể, Trưởng nhóm",
    labelAudience: "Khán giả",
    phAudience: "vd: Cổ đông, Gia đình, Nhóm lập trình",
    labelGoal: "Mục tiêu",
    phGoal: "vd: Thuyết phục nhà đầu tư, Truyền cảm hứng",
    labelContext: "Bối cảnh",
    phContext: "Chi tiết bổ sung: Tiệc thường niên, họp sau khủng hoảng, tiệc cưới...",
    labelTone: "Chiến lược Giọng điệu",
    btnGenerate: "Tạo Bài Diễn Văn",
    btnGenerating: "Đang Chế Tác Tuyệt Phẩm...",
    stageTitle: "Sân Khấu",
    btnStyle: "Kiểu",
    btnEdit: "Chỉnh sửa",
    btnDone: "Xong",
    btnRehearse: "Tập dượt",
    analysisTitle: "Phân Tích Hùng Biện",
    scoreTitle: "Điểm Phức Tạp",
    devicesTitle: "Biện Pháp Tu Từ",
    libTitle: "Thư viện Bài nói",
    searchPlaceholder: "Tìm kiếm bài nói...",
    emptyLib: "Thư viện trống. Hãy tạo tuyệt phẩm đầu tiên của bạn!",
    openSpeech: "Mở Bài Nói",
    errorRequired: "Vui lòng điền các trường bắt buộc (Người nói, Khán giả, Mục tiêu).",
    errorAudio: "Không nhận được dữ liệu âm thanh.",
    errorGenAudio: "Không thể tạo âm thanh.",
    errorGenSpeech: "Không thể tạo bài diễn văn.",
    placeholderStage: "\"Bục diễn đang chờ lời vàng ngọc của bạn...\"",
    tones: {
       Solemn: { label: "Trang trọng", desc: "Từ ngữ trang trọng, Hán Việt. Cấu trúc câu phức. Không khí nghiêm trang & tôn trọng." },
       Inspiring: { label: "Truyền cảm hứng", desc: "Động từ mạnh, từ ngữ giàu hình ảnh. Sử dụng phép điệp & liệt kê. Năng lượng & đầy hy vọng." },
       Witty: { label: "Hài hước", desc: "Vui tươi, chơi chữ, tự trào. Câu ngắn, dứt khoát với những cú twist bất ngờ. Nhẹ nhàng." },
       Emotional: { label: "Cảm xúc", desc: "Gợi cảm, từ ngữ cá nhân. Dòng chảy tự sự, thoải mái. Dễ bị tổn thương & kết nối." }
    }
  }
};

// --- Types ---
interface RhetoricalAnalysis {
  rhetoricalDevices: string[];
  complexityScore: number;
  complexityExplanation: string;
}

interface SavedSpeech {
  id: string;
  title: string;
  speaker: string;
  audience: string;
  goal: string;
  context: string;
  tone: string;
  content: string;
  timestamp: number;
  tags: string[];
  analysis?: RhetoricalAnalysis;
  lang: 'en' | 'vi';
}

// --- Components ---

function App() {
  // Navigation State
  const [view, setView] = useState<'create' | 'library'>('create');
  
  // Language State
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const t = TRANSLATIONS[lang];

  // Input State
  const [speaker, setSpeaker] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("Inspiring");
  
  // Output State
  const [generatedSpeech, setGeneratedSpeech] = useState<string>("");
  const [analysis, setAnalysis] = useState<RhetoricalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor & Styling State
  const [isEditing, setIsEditing] = useState(false);
  const [directionColor, setDirectionColor] = useState("#fbbf24"); // Default Amber
  const [showStylePicker, setShowStylePicker] = useState(false);

  // Library State
  const [savedSpeeches, setSavedSpeeches] = useState<SavedSpeech[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Audio Context
  const audioContextRef = useRef<AudioContext | null>(null);

  // Tones Metadata (Logic)
  const toneLogic = [
    { id: "Solemn", voice: "Charon" },
    { id: "Inspiring", voice: "Fenrir" },
    { id: "Witty", voice: "Puck" },
    { id: "Emotional", voice: "Kore" },
  ];

  // Initialize AI
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Load Library from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("vai_speech_library");
    if (saved) {
      try {
        setSavedSpeeches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load library", e);
      }
    }
  }, []);

  // Save Library to LocalStorage
  useEffect(() => {
    localStorage.setItem("vai_speech_library", JSON.stringify(savedSpeeches));
  }, [savedSpeeches]);

  const handleGenerate = async () => {
    if (!speaker || !audience || !goal) {
      setError(t.errorRequired);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setGeneratedSpeech("");
    setIsEditing(false);

    try {
      const promptText = `
        Target Language: ${lang === 'vi' ? 'Vietnamese' : 'English'}
        Speaker: ${speaker}
        Audience: ${audience}
        Goal: ${goal}
        Context: ${context}
        Tone: ${tone}
        
        Generate the speech and provide an analysis in ${lang === 'vi' ? 'Vietnamese' : 'English'}.
      `;

      let jsonString = "";

      try {
        // First attempt: Strict Schema
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: promptText,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.8,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                speechMarkdown: { type: Type.STRING, description: "The speech text in Markdown format with *[Stage Directions]*." },
                analysis: {
                  type: Type.OBJECT,
                  properties: {
                    rhetoricalDevices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of rhetorical devices used (e.g. Metaphor, Anaphora)." },
                    complexityScore: { type: Type.NUMBER, description: "A score from 1-10 indicating linguistic complexity." },
                    complexityExplanation: { type: Type.STRING, description: "Brief explanation of the score." }
                  },
                  required: ["rhetoricalDevices", "complexityScore", "complexityExplanation"]
                }
              },
              required: ["speechMarkdown", "analysis"]
            },
          },
        });
        jsonString = response.text || "{}";
      } catch (innerError) {
        console.warn("Standard generation failed, retrying with fallback...", innerError);
        
        // Fallback: Prompt-based JSON without strict schema
        const fallbackPrompt = `
          ${promptText}
          
          IMPORTANT: Return the response in strict JSON format.
          Example Structure:
          {
            "speechMarkdown": "# Title\\n\\nSpeech content...",
            "analysis": {
              "rhetoricalDevices": ["Metaphor", "Rule of Three"],
              "complexityScore": 7,
              "complexityExplanation": "Explanation..."
            }
          }
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: fallbackPrompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.8,
                responseMimeType: "application/json"
            }
        });
        jsonString = response.text || "{}";
      }

      const json = JSON.parse(jsonString);
      if (json.speechMarkdown) {
        setGeneratedSpeech(json.speechMarkdown);
        setAnalysis(json.analysis);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.errorGenSpeech);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!generatedSpeech) return;
    setIsAudioLoading(true);

    try {
      const selectedTone = toneLogic.find(t => t.id === tone);
      const voiceName = selectedTone ? selectedTone.voice : 'Zephyr';

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: {
          parts: [{ text: generatedSpeech }]
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        await playAudio(base64Audio);
      } else {
        setError(t.errorAudio);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || t.errorGenAudio);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const decodeAudioData = async (data: Uint8Array) => {
       const dataInt16 = new Int16Array(data.buffer);
       const numChannels = 1;
       const frameCount = dataInt16.length / numChannels;
       const buffer = ctx.createBuffer(numChannels, frameCount, 24000);
       
       for(let channel = 0; channel < numChannels; channel++) {
         const channelData = buffer.getChannelData(channel);
         for (let i=0; i < frameCount; i++) {
           channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
         }
       }
       return buffer;
    };

    const audioBuffer = await decodeAudioData(bytes);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  };

  const saveSpeech = () => {
    if (!generatedSpeech) return;
    const newSpeech: SavedSpeech = {
      id: Date.now().toString(),
      title: `${goal} - ${speaker}`,
      speaker,
      audience,
      goal,
      context,
      tone,
      content: generatedSpeech,
      timestamp: Date.now(),
      tags: [tone, ...analysis?.rhetoricalDevices || []],
      analysis: analysis || undefined,
      lang: lang
    };
    setSavedSpeeches([newSpeech, ...savedSpeeches]);
    setView('library');
  };

  const deleteSpeech = (id: string) => {
    setSavedSpeeches(savedSpeeches.filter(s => s.id !== id));
  };

  const loadSpeech = (s: SavedSpeech) => {
    setSpeaker(s.speaker);
    setAudience(s.audience);
    setGoal(s.goal);
    setContext(s.context);
    setTone(s.tone);
    setGeneratedSpeech(s.content);
    setAnalysis(s.analysis || null);
    // Optionally switch lang to match speech, but user might want to read in current lang?
    // Let's keep current lang UI but the content is what it is.
    setView('create');
  };

  // Custom Markdown renderer
  const MarkdownComponents = {
    em: ({node, ...props}: any) => <span className="stage-direction" style={{ color: directionColor }} {...props} />,
    strong: ({node, ...props}: any) => <span className="font-bold text-yellow-100" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-4 text-slate-300 leading-relaxed text-lg" {...props} />,
    h1: ({node, ...props}: any) => <h1 className="text-3xl font-serif text-yellow-500 mb-6 border-b border-slate-700 pb-2" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-2xl font-serif text-yellow-400 mb-4 mt-6" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-xl font-serif text-yellow-300 mb-3 mt-4" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc list-outside ml-6 mb-4 text-slate-300" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal list-outside ml-6 mb-4 text-slate-300" {...props} />,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-yellow-500/30 font-sans">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('create')}>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-700 rounded-full flex items-center justify-center text-slate-900 font-serif font-bold text-xl shadow-lg shadow-yellow-500/20">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">{t.title}</h1>
              <p className="text-xs text-yellow-500 font-medium tracking-widest uppercase">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {/* Language Switcher */}
             <div className="flex bg-slate-800 p-0.5 rounded-lg mr-2">
               <button 
                 onClick={() => setLang('en')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-yellow-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}
               >
                 EN
               </button>
               <button 
                 onClick={() => setLang('vi')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'vi' ? 'bg-yellow-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}
               >
                 VI
               </button>
             </div>

             <nav className="flex bg-slate-800 p-1 rounded-lg">
                <button 
                  onClick={() => setView('create')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'create' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  {t.navGenerator}
                </button>
                <button 
                  onClick={() => setView('library')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'library' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  {t.navLibrary}
                </button>
             </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {view === 'create' ? (
          <>
            {/* LEFT COLUMN: Controls */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 shadow-xl">
                <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                  <span className="text-yellow-500">✦</span> {t.briefTitle}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t.labelSpeaker}</label>
                    <input 
                      type="text" 
                      value={speaker} 
                      onChange={(e) => setSpeaker(e.target.value)}
                      placeholder={t.phSpeaker}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm placeholder-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t.labelAudience}</label>
                    <input 
                      type="text" 
                      value={audience} 
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder={t.phAudience}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm placeholder-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t.labelGoal}</label>
                    <input 
                      type="text" 
                      value={goal} 
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder={t.phGoal}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm placeholder-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t.labelContext}</label>
                    <textarea 
                      value={context} 
                      onChange={(e) => setContext(e.target.value)}
                      placeholder={t.phContext}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm placeholder-slate-600 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{t.labelTone}</label>
                    <div className="grid grid-cols-1 gap-3">
                      {toneLogic.map((logic) => {
                        // @ts-ignore
                        const toneDisplay = t.tones[logic.id];
                        return (
                          <button
                            key={logic.id}
                            onClick={() => setTone(logic.id)}
                            className={`text-left px-4 py-3 rounded-lg border transition-all relative overflow-hidden group ${
                              tone === logic.id 
                              ? "bg-yellow-500/10 border-yellow-500 shadow-lg shadow-yellow-500/10" 
                              : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            <div className="flex justify-between items-center relative z-10 mb-1">
                              <span className={`font-semibold text-sm ${tone === logic.id ? "text-yellow-400" : "text-white"}`}>{toneDisplay.label}</span>
                              {tone === logic.id && <span className="text-[10px] font-bold bg-yellow-500 text-slate-900 px-1.5 py-0.5 rounded">ACTIVE</span>}
                            </div>
                            <div className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">
                              {toneDisplay.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-500/20 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="loader ease-linear rounded-full border-2 border-t-2 border-slate-900 h-5 w-5"></div>
                        {t.btnGenerating}
                      </>
                    ) : (
                      <>
                        <span>{t.btnGenerate}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Output */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-slate-800/50 rounded-2xl border border-slate-700 min-h-[600px] flex flex-col relative overflow-hidden shadow-2xl">
                
                {/* Toolbar */}
                <div className="border-b border-slate-700 bg-slate-900/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between backdrop-blur-sm gap-4 sm:gap-0">
                  <div className="flex items-center gap-4">
                     <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">{t.stageTitle}</h3>
                     {/* Color Picker Trigger */}
                     <div className="relative">
                        <button 
                          onClick={() => setShowStylePicker(!showStylePicker)}
                          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
                          title="Stage Direction Style"
                        >
                          <span className="w-3 h-3 rounded-full" style={{backgroundColor: directionColor}}></span>
                          {t.btnStyle}
                        </button>
                        {showStylePicker && (
                          <div className="absolute top-8 left-0 z-50 bg-slate-800 border border-slate-700 p-2 rounded-lg shadow-xl grid grid-cols-4 gap-2 w-32">
                            {['#fbbf24', '#f87171', '#60a5fa', '#34d399', '#c084fc', '#e879f9', '#a78bfa', '#ffffff'].map(c => (
                              <button 
                                key={c} 
                                onClick={() => { setDirectionColor(c); setShowStylePicker(false); }}
                                className="w-6 h-6 rounded-full border border-slate-600 hover:scale-110 transition-transform" 
                                style={{backgroundColor: c}} 
                              />
                            ))}
                          </div>
                        )}
                     </div>
                  </div>
                   <div className="flex flex-wrap gap-2">
                     <button 
                        onClick={() => setIsEditing(!isEditing)}
                        disabled={!generatedSpeech}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isEditing ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:text-white'}`}
                      >
                        {isEditing ? t.btnDone : t.btnEdit}
                      </button>
                     <button 
                       onClick={() => navigator.clipboard.writeText(generatedSpeech || "")}
                       disabled={!generatedSpeech}
                       className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                       title="Copy Text"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                     </button>
                     <button 
                       onClick={saveSpeech}
                       disabled={!generatedSpeech}
                       className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                       title="Save to Library"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                     </button>
                     <button 
                       onClick={handlePlayAudio}
                       disabled={!generatedSpeech || isAudioLoading}
                       className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 ml-2"
                     >
                       {isAudioLoading ? (
                         <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                       ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                         </svg>
                       )}
                       {t.btnRehearse}
                     </button>
                   </div>
                </div>

                {/* Content Area */}
                <div className="p-8 lg:p-12 overflow-y-auto flex-grow relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-900">
                  {generatedSpeech ? (
                    isEditing ? (
                      <textarea 
                        className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-300 font-mono text-lg resize-none p-0 focus:outline-none"
                        value={generatedSpeech}
                        onChange={(e) => setGeneratedSpeech(e.target.value)}
                        spellCheck={false}
                      />
                    ) : (
                      <div className="max-w-3xl mx-auto speech-content animate-fade-in">
                        <ReactMarkdown components={MarkdownComponents}>
                          {generatedSpeech}
                        </ReactMarkdown>
                      </div>
                    )
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50 select-none">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-600 mb-4 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <p className="font-serif italic text-lg">{t.placeholderStage}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Dashboard */}
              {analysis && (
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 shadow-xl">
                  <h3 className="text-lg font-serif text-white mb-4 flex items-center gap-2">
                    <span className="text-yellow-500">📊</span> {t.analysisTitle}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                       <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">{t.scoreTitle}</h4>
                       <div className="flex items-end gap-2">
                          <span className="text-4xl font-serif text-white">{analysis.complexityScore}</span>
                          <span className="text-sm text-slate-400 mb-1">/ 10</span>
                       </div>
                       <p className="text-xs text-slate-400 mt-2 leading-relaxed">{analysis.complexityExplanation}</p>
                    </div>
                    <div className="col-span-2 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                       <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">{t.devicesTitle}</h4>
                       <div className="flex flex-wrap gap-2">
                         {analysis.rhetoricalDevices.map((device, idx) => (
                           <span key={idx} className="bg-slate-800 text-yellow-500 px-3 py-1 rounded-full text-xs border border-slate-700">
                             {device}
                           </span>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* LIBRARY VIEW */
          <div className="col-span-1 lg:col-span-12">
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 min-h-[600px] shadow-xl">
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <h2 className="text-3xl font-serif text-white">{t.libTitle}</h2>
                  <div className="relative w-full md:w-96">
                    <input 
                      type="text" 
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-yellow-500"
                    />
                    <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {savedSpeeches.length === 0 ? (
                   <div className="col-span-full text-center py-20 text-slate-500 italic">
                     {t.emptyLib}
                   </div>
                 ) : (
                   savedSpeeches
                    .filter(s => 
                      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      s.context.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((s) => (
                     <div key={s.id} className="bg-slate-900 border border-slate-700 rounded-xl p-6 hover:border-yellow-500/50 transition-colors group relative flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                           <div className="text-xs text-yellow-500 font-bold uppercase tracking-wider">{s.tone}</div>
                           <button onClick={(e) => {e.stopPropagation(); deleteSpeech(s.id);}} className="text-slate-600 hover:text-red-400">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                           </button>
                        </div>
                        <h3 className="text-lg font-serif text-white font-medium mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors">{s.title}</h3>
                        <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-grow">{s.context}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-4">
                           {s.tags.slice(0, 3).map(t => (
                             <span key={t} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">{t}</span>
                           ))}
                           {s.tags.length > 3 && <span className="text-[10px] text-slate-500 self-center">+{s.tags.length - 3}</span>}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
                           <span>{new Date(s.timestamp).toLocaleDateString()}</span>
                           <button 
                             onClick={() => loadSpeech(s)}
                             className="text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"
                           >
                             {t.openSpeech}
                           </button>
                        </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);