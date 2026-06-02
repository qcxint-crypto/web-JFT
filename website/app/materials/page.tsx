'use client'

import { useState } from 'react'
import data from './data.json'

export default function MaterialsPage() {
  const categoryKeys = Object.keys(data)
  const [activeCategory, setActiveCategory] = useState<string>(categoryKeys[0] || '')

  const currentFiles = (data as any)[activeCategory] || []

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <section className="glass-panel relative overflow-hidden rounded-[38px] px-6 py-8 sm:px-8 sm:py-10">
        <div className="relative space-y-2">
          <span className="eyebrow">Learning Center</span>
          <h1 className="font-display text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Materi & Latihan Soal
          </h1>
          <p className="dashboard-copy max-w-2xl text-slate-600">
            Lihat langsung di browser atau download untuk belajar offline. Semua materi dipisahkan berdasarkan kategori untuk memudahkan pencarian.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar Tabs */}
        <aside className="space-y-2">
          {categoryKeys.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full text-left p-4 rounded-[22px] transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <div className="font-bold">{cat}</div>
              <div className={`text-xs mt-1 ${activeCategory === cat ? 'text-white/60' : 'text-slate-400'}`}>
                {(data as any)[cat].length} file
              </div>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <section className="glass-panel p-6 sm:p-8 rounded-[38px]">
          <div className="section-head mb-6">
            <div>
              <span className="eyebrow">{activeCategory.toUpperCase()}</span>
              <h2 className="font-display text-2xl font-bold tracking-[-0.05em] text-slate-950">{activeCategory}</h2>
            </div>
          </div>

          <div className="grid gap-3">
            {currentFiles.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-900/10 rounded-[28px]">
                Tidak ada file di kategori ini.
              </div>
            ) : (
              currentFiles.map((file: any, index: number) => (
                <div 
                  key={index} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[24px] border border-slate-900/5 bg-white/90 hover:bg-white transition-colors"
                >
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-red-50 text-red-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-bold text-slate-900 truncate" title={file.name}>{file.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 truncate">
                        {file.path.split('/').slice(0, -1).join(' / ') || 'Root'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a 
                      href={`/api/pdf/${file.path.split('/').map((s: string) => encodeURIComponent(s)).join('/')}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-[16px] bg-slate-200 px-5 py-2.5 text-xs font-bold text-slate-900 hover:bg-slate-300 transition-colors"
                    >
                      Lihat
                    </a>

                    <a 
                      href={`/api/pdf/${file.path.split('/').map((s: string) => encodeURIComponent(s)).join('/')}?download=true`} 
                      className="inline-flex items-center justify-center rounded-[16px] bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
