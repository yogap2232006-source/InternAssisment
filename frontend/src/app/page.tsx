"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  summary: string;
  description: string;
}

export default function Dashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  const fetchBooks = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/books/");
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScraping(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/books/upload/", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchBooks();
      } else {
        console.error("Upload failed", await res.text());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScraping(false);
      e.target.value = '';
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch("http://localhost:8000/api/books/upload/", {
        method: "POST",
      });
      if (res.ok) {
        await fetchBooks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Your Library</h1>
          <p className="text-slate-400 mt-2">Manage and explore your AI-curated books.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleScrape}
            disabled={scraping}
            className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50"
          >
            Auto Scrape Demo
          </button>

          <label className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer">
            {scraping ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></span>
                Processing...
              </span>
            ) : (
              "Upload Book (.pdf, .txt)"
            )}
            <input 
              type="file" 
              accept=".txt,.pdf" 
              onChange={handleUpload} 
              className="hidden" 
              disabled={scraping} 
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-700 rounded-xl bg-slate-800/20">
          <p className="text-slate-400">Your library is empty. Import books to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`}>
              <div className="group border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 rounded-2xl p-6 transition-all hover:border-indigo-500/50 cursor-pointer h-full flex flex-col hover:shadow-xl hover:shadow-indigo-500/10">
                <div className="mb-4 flex-1">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h2 className="text-xl font-bold line-clamp-2 leading-tight group-hover:text-indigo-300 transition-colors">{book.title}</h2>
                  </div>
                  <div className="inline-block px-2.5 py-1 mb-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full">
                    {book.genre || "Uncategorized"}
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-3">
                    {book.summary || book.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                  By {book.author}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
