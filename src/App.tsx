import React, { useState } from 'react';
import NewsBriefing from './components/NewsBriefing';
import { Leaf, RefreshCw, Globe } from 'lucide-react';
import { motion } from 'motion/react';

const TOPICS = [
  "Today's Top World News",
  "Iran and USA Relations",
  "Global Technology",
  "Business & Markets",
  "Health & Science"
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Hindi",
  "Arabic",
  "Mandarin",
  "Japanese"
];

export default function App() {
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-emerald-200 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Leaf className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-serif font-semibold tracking-tight text-stone-800">
              Zen News
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="pl-9 pr-8 py-2 bg-stone-100 border-transparent rounded-full text-sm font-medium text-stone-700 focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-colors appearance-none cursor-pointer outline-none"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              aria-label="Refresh News"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Topic Selector */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold tracking-widest text-stone-400 uppercase mb-4">
            Select a Topic
          </h2>
          <div className="flex flex-wrap gap-3">
            {TOPICS.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedTopic === topic
                    ? 'bg-stone-900 text-white shadow-md scale-105'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* News Content */}
        <div key={`${refreshKey}-${selectedLanguage}`}>
          <NewsBriefing topic={selectedTopic} language={selectedLanguage} />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-stone-200/50 text-center">
        <p className="text-sm text-stone-400 font-medium">
          Generated automatically using AI and real-time search.
        </p>
      </footer>
    </div>
  );
}
