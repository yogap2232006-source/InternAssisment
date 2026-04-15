"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { use } from "react";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  summary: string;
  description: string;
  url: string;
}

export default function BookDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [book, setBook] = useState<Book | null>(null);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookRes = await fetch(`http://localhost:8000/api/books/${id}/`);
        if (bookRes.ok) {
          setBook(await bookRes.json());
        }
        
        const recRes = await fetch(`http://localhost:8000/api/books/${id}/recommendations/`);
        if (recRes.ok) {
          setRecommendations(await recRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
    </div>
  );

  if (!book) return <div className="text-center py-20 text-slate-400">Book not found.</div>;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <Link href="/" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors mb-4 inline-block">&larr; Back to Library</Link>
        <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex flex-col md:flex-row gap-8 z-10 relative">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 mb-4 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold rounded-full text-sm">
                Predicted Genre: {book.genre}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{book.title}</h1>
              <p className="text-xl text-slate-400 mb-6">By {book.author}</p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-800 pb-2">AI Summary</h3>
                  <p className="text-slate-300 leading-relaxed font-medium bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/10 shadow-inner">
                    {book.summary}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-800 pb-2">Full Description</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    {book.description}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <a href={book.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center bg-white text-black hover:bg-slate-200 px-6 py-2.5 rounded-lg font-bold transition-all text-sm">
                  View Original Link &nearr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="border-t border-slate-800 pt-12">
          <h2 className="text-2xl font-bold mb-6">If you liked this, you might also enjoy:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map(rec => (
              <Link key={rec.id} href={`/books/${rec.id}`}>
                <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/30 hover:bg-slate-800 transition-colors h-full flex flex-col hover:border-indigo-500/30">
                  <h3 className="font-bold text-sm mb-2 line-clamp-2">{rec.title}</h3>
                  <div className="text-xs text-indigo-400 mb-2">{rec.genre}</div>
                  <p className="text-xs text-slate-500 line-clamp-3 mt-auto">{rec.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
