import React, { useEffect, useState } from 'react';
import { streamNewsBriefing, generateNewsImage, NewsSource } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface NewsBriefingProps {
  topic: string;
  language: string;
}

export default function NewsBriefing({ topic, language }: NewsBriefingProps) {
  const [text, setText] = useState<string>("");
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      // Reset state
      setText("");
      setSources([]);
      setImageUrl(null);
      setLoading(true);
      setImageLoading(true);
      setError(null);

      // Start image generation in parallel
      generateNewsImage(topic).then(url => {
        if (isMounted) {
          setImageUrl(url);
          setImageLoading(false);
        }
      }).catch(() => {
        if (isMounted) setImageLoading(false);
      });

      try {
        await streamNewsBriefing(
          topic,
          language,
          (chunk) => {
            if (isMounted) {
              setText((prev) => prev + chunk);
              setLoading(false); // Stop showing full-page loader once we have first chunk
            }
          },
          (newSources) => {
            if (isMounted) {
              setSources(newSources);
            }
          }
        );
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "An unexpected error occurred.");
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadNews();

    return () => {
      isMounted = false;
    };
  }, [topic, language]);

  if (loading && !text) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-stone-500">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="mb-6"
        >
          <div className="w-16 h-16 border-4 border-stone-200 border-t-emerald-600 rounded-full" />
        </motion.div>
        <p className="text-lg font-medium tracking-wide animate-pulse">Gathering the latest news...</p>
      </div>
    );
  }

  if (error && !text) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-red-600 bg-red-50 rounded-2xl">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium text-center">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden mb-8">
        {/* Image Section */}
        {imageLoading ? (
          <div className="w-full h-64 md:h-80 bg-stone-100 animate-pulse flex flex-col items-center justify-center text-stone-400">
            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm font-medium">Generating high-quality image...</span>
          </div>
        ) : imageUrl ? (
          <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={imageUrl} 
            alt={topic} 
            className="w-full h-64 md:h-96 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : null}

        <div className="p-6 md:p-10">
          <div className="prose prose-stone prose-lg max-w-none prose-headings:font-serif prose-headings:font-medium prose-a:text-emerald-600 hover:prose-a:text-emerald-700">
            <ReactMarkdown>{text}</ReactMarkdown>
            {loading && (
              <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {sources.length > 0 && (
        <div className="bg-stone-50 rounded-2xl p-6 md:p-8 border border-stone-100">
          <h3 className="text-sm font-semibold tracking-widest text-stone-400 uppercase mb-6">
            Sources & References
          </h3>
          <ul className="space-y-4">
            {sources.map((source, idx) => (
              <motion.li 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-3 -mx-3 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200"
                >
                  <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-stone-800 font-medium leading-snug group-hover:text-emerald-700 transition-colors">
                      {source.title}
                    </p>
                    <p className="text-xs text-stone-400 mt-1 truncate max-w-xs md:max-w-md">
                      {new URL(source.uri).hostname}
                    </p>
                  </div>
                </a>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
