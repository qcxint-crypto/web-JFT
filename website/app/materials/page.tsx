'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface DriveItem {
  id: string;
  name: string;
  isFolder: boolean;
}

const ROOT_ID = '1LdWOImJrkJv1QxEa4465sraLavON99GV';

export default function MaterialsPage() {
  const [sidebarItems, setSidebarItems] = useState<DriveItem[]>([])
  const [activeFolderId, setActiveFolderId] = useState<string>(ROOT_ID)
  const [activeFolderName, setActiveFolderName] = useState<string>('Semua Materi')
  const [currentFiles, setCurrentFiles] = useState<DriveItem[]>([])
  const [loadingSidebar, setLoadingSidebar] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Breadcrumb path tracking
  const [history, setHistory] = useState<{id: string, name: string}[]>([{id: ROOT_ID, name: 'Utama'}])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch root folders for categories
  const fetchRootFolders = useCallback(async () => {
    setLoadingSidebar(true)
    try {
      const res = await fetch(`/api/materials?folderId=${ROOT_ID}`)
      if (!res.ok) throw new Error('Gagal terhubung ke server')
      const data = await res.json()
      const folders = data.filter((i: DriveItem) => i.isFolder)
      setSidebarItems(folders)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingSidebar(false)
    }
  }, [])

  // Fetch content for active folder
  const fetchContent = useCallback(async (folderId: string) => {
    setLoadingContent(true)
    try {
      const res = await fetch(`/api/materials?folderId=${folderId}`)
      if (!res.ok) throw new Error('Gagal memuat isi folder')
      const data = await res.json()
      setCurrentFiles(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoadingContent(false)
    }
  }, [])

  useEffect(() => {
    fetchRootFolders()
  }, [fetchRootFolders])

  useEffect(() => {
    fetchContent(activeFolderId)
  }, [activeFolderId, fetchContent])

  const navigateTo = (id: string, name: string) => {
    setActiveFolderId(id)
    setActiveFolderName(name)
    
    const idx = history.findIndex(h => h.id === id)
    if (idx !== -1) {
        setHistory(history.slice(0, idx + 1))
    } else {
        setHistory([...history, {id, name}])
    }
    
    // Smooth scroll content area into view on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        window.scrollTo({ top: 400, behavior: 'smooth' })
    }
  }

  const goBack = () => {
    if (history.length > 1) {
        const prev = history[history.length - 2]
        navigateTo(prev.id, prev.name)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-10">
      
      {/* Page Title & Intro */}
      <div className="mb-8 md:mb-12 fade-up">
        <h1 className="text-3xl font-black tracking-tight text-white md:text-6xl leading-[1.1]">
          Materi & Latihan
        </h1>
        <p className="mt-3 text-slate-400 max-w-2xl text-sm md:text-lg leading-relaxed opacity-80">
          Akses modul, kosakata, dan soal ujian JFT dari Google Drive yang selalu terupdate.
        </p>
      </div>

      {/* MOBILE NAV SCROLLER */}
      <div className="lg:hidden mb-8 -mx-4 px-4 overflow-x-auto scrollbar-hide no-select sticky top-0 bg-slate-950/80 backdrop-blur-md py-4 z-20 border-b border-slate-900/50">
        <div className="flex gap-2.5 min-w-max">
            <button
                onClick={() => navigateTo(ROOT_ID, 'Semua Materi')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                    activeFolderId === ROOT_ID 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105' 
                    : 'bg-slate-900 text-slate-500 border border-slate-800/50'
                }`}
            >
                BERANDA
            </button>
            {sidebarItems.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => navigateTo(cat.id, cat.name)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border ${
                        activeFolderId === cat.id 
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20 scale-105' 
                        : 'bg-slate-900 text-slate-500 border-slate-800/50'
                    }`}
                >
                    {cat.name.toUpperCase()}
                </button>
            ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px,1fr]">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
                <h2 className="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">Kategori Utama</h2>
                <nav className="flex flex-col gap-1.5 rounded-[32px] border border-slate-800/60 bg-slate-900/20 p-2 backdrop-blur-xl">
                <button
                    onClick={() => navigateTo(ROOT_ID, 'Semua Materi')}
                    className={`flex items-center gap-3 rounded-[22px] px-5 py-4 text-left transition-all group ${
                    activeFolderId === ROOT_ID ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-800/40 hover:text-white'
                    }`}
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span className="font-black text-[13px]">Beranda</span>
                </button>

                {loadingSidebar ? (
                    Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="h-14 w-full animate-pulse rounded-[22px] bg-slate-800/30" />
                    ))
                ) : (
                    sidebarItems.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => navigateTo(cat.id, cat.name)}
                        className={`flex items-center gap-3 rounded-[22px] px-5 py-4 text-left transition-all border group ${
                        activeFolderId === cat.id 
                        ? 'bg-slate-800 text-blue-400 border-slate-700 shadow-lg' 
                        : 'text-slate-500 border-transparent hover:bg-slate-800/30 hover:text-slate-300'
                        }`}
                    >
                        <svg className="h-5 w-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        <span className="font-black truncate text-[13px]">{cat.name}</span>
                    </button>
                    ))
                )}
                </nav>
            </div>
            
            <div className="rounded-[28px] bg-gradient-to-br from-blue-600/10 to-transparent p-6 border border-blue-500/10">
                <p className="text-xs font-bold text-blue-400/80 leading-relaxed uppercase tracking-wider">
                    💡 Berhasil disinkronkan secara live dengan Google Drive.
                </p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="space-y-6">
          
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-widest no-select">
            {history.map((h, i) => (
              <div key={h.id} className="flex items-center gap-2">
                 {i > 0 && <span className="text-slate-800">/</span>}
                 <button 
                  onClick={() => navigateTo(h.id, h.name)}
                  className={`transition-all ${i === history.length - 1 ? 'text-blue-500' : 'text-slate-600 hover:text-slate-400'}`}
                 >
                   {h.name}
                 </button>
              </div>
            ))}
          </div>

          {/* Current Selection Header */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-900 pb-6">
            <div className="min-w-0">
                <h2 className="text-2xl font-black text-white md:text-4xl truncate pr-4">{activeFolderName}</h2>
            </div>
            
            {history.length > 1 && (
                <button 
                  onClick={goBack}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all active:scale-90"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  KEMBALI
                </button>
            )}
          </div>

          {/* LIST ITEMS */}
          <div className="grid gap-3 md:gap-4">
            {loadingContent ? (
               Array.from({length: 4}).map((_, i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded-[28px] bg-slate-900/40 border border-slate-800/30" />
               ))
            ) : currentFiles.length === 0 ? (
                <div className="rounded-[40px] border-2 border-dashed border-slate-900/50 py-24 text-center">
                    <p className="text-slate-700 font-black italic tracking-widest text-sm uppercase">DATA TIDAK DITEMUKAN</p>
                </div>
            ) : (
                <>
                    {currentFiles.map((item) => (
                        <div 
                          key={item.id}
                          className="group flex flex-col gap-4 rounded-[30px] border border-slate-800/60 bg-slate-900/30 p-4 md:p-6 transition-all duration-300 hover:border-slate-600 hover:bg-slate-900/80 md:flex-row md:items-center md:justify-between active:scale-[0.985]"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-2xl md:rounded-[22px] transition-all group-hover:rotate-3 ${item.isFolder ? 'bg-blue-600/10 text-blue-500' : 'bg-rose-600/10 text-rose-500'}`}>
                                {item.isFolder ? (
                                    <svg className="h-6 w-6 md:h-7 md:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                ) : (
                                    <svg className="h-6 w-6 md:h-7 md:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base md:text-xl font-black text-white group-hover:text-blue-400 transition-colors leading-snug break-words line-clamp-2">
                                    {item.name}
                                </h3>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                                        {item.isFolder ? 'DIREKTORI' : 'PDF DOCUMENT'}
                                    </span>
                                    {item.isFolder && (
                                        <span className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest italic">• BUKA FOLDER</span>
                                    )}
                                </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {item.isFolder ? (
                                <button 
                                  onClick={() => navigateTo(item.id, item.name)}
                                  className="w-full rounded-2xl bg-blue-600 text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all active:scale-95 md:w-auto"
                                >
                                  Buka Folder
                                </button>
                            ) : (
                                <>
                                    <a 
                                      href={`https://drive.google.com/file/d/${item.id}/preview`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 rounded-2xl bg-slate-800 border border-slate-700/50 px-5 py-3.5 text-center text-xs font-black uppercase tracking-widest text-white hover:bg-slate-700 transition-all active:scale-95 md:flex-none md:min-w-[110px]"
                                    >
                                      Lihat
                                    </a>
                                    <a 
                                      href={`https://drive.google.com/u/0/uc?id=${item.id}&export=download`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 rounded-2xl bg-blue-600 px-5 py-3.5 text-center text-xs font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/20 md:flex-none md:min-w-[110px]"
                                    >
                                      Unduh
                                    </a>
                                </>
                            )}
                          </div>
                        </div>
                    ))}
                </>
            )}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .no-select {
            user-select: none;
            -webkit-user-select: none;
        }
        @keyframes fade-up {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .fade-up {
            animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
