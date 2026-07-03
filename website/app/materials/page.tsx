'use client'

import { useState, useEffect, useCallback } from 'react'

interface DriveItem {
  id: string;
  name: string;
  isFolder: boolean;
}

const ROOT_ID = '1LdWOImJrkJv1QxEa4465sraLavON99GV';

export default function MaterialsPage() {
  const [activeFolderId, setActiveFolderId] = useState<string>(ROOT_ID)
  const [activeFolderName, setActiveFolderName] = useState<string>('Materi & Latihan')
  const [items, setItems] = useState<DriveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<{id: string, name: string}[]>([{id: ROOT_ID, name: 'Utama'}])

  const fetchContent = useCallback(async (folderId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/materials?folderId=${folderId}`)
      if (!res.ok) throw new Error('Gagal memuat data')
      const data = await res.json()
      setItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

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
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    if (history.length > 1) {
        const prev = history[history.length - 2]
        navigateTo(prev.id, prev.name)
    }
  }

  return (
    <div className="space-y-10 py-6">
      
      {/* Hero Section */}
      <section className="fade-up">
        <div className="space-y-4">
          <span className="eyebrow">digital resources</span>
          <h1 className="dashboard-title">
            {history.length > 1 ? activeFolderName : 'Materi Materi'}
          </h1>
          <p className="dashboard-copy">
            {history.length > 1 
              ? `Menampilkan isi direktori ${activeFolderName}. Semua file disinkronkan secara live.`
              : 'Akses cepat ke semua modul pembelajaran, daftar kosakata, dan kumpulan soal ujian JFT yang selalu terupdate otomatis.'
            }
          </p>
        </div>
      </section>

      {/* Navigation & Controls */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 no-select">
            {history.length > 1 && (
                <button 
                  onClick={goBack}
                  className="button-ghost tap-feedback flex items-center gap-2 !min-h-[40px] px-4 !rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Kembali
                </button>
            )}
            
            <div className="flex items-center gap-1.5 px-2">
                {history.map((h, i) => (
                    <div key={h.id} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-slate-800 font-bold opacity-30">/</span>}
                        <button 
                            onClick={() => navigateTo(h.id, h.name)}
                            className={`text-[11px] font-black uppercase tracking-widest transition-all ${i === history.length - 1 ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {h.name}
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Main Grid - Homepage mode-card style */}
      <div className="dashboard-actions !grid-cols-1 md:!grid-cols-2">
        {loading ? (
           Array.from({length: 4}).map((_, i) => (
            <div key={i} className="panel-soft h-40 w-full animate-pulse border-none" />
           ))
        ) : items.length === 0 ? (
            <div className="panel-soft col-span-full py-32 text-center">
                <span className="eyebrow">empty folder</span>
                <p className="mt-2 text-slate-500 font-bold">Tidak ada file atau folder ditemukan di direktori ini.</p>
            </div>
        ) : (
            items.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => item.isFolder && navigateTo(item.id, item.name)}
                  className={`mode-card tap-feedback group relative overflow-hidden cursor-pointer ${!item.isFolder ? 'mode-card--active' : ''}`}
                >
                  <span className={`mode-card__tag !px-3 !py-1 !text-[9px] ${item.isFolder ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {item.isFolder ? 'FOLDER' : 'PDF ASSET'}
                  </span>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 !mt-4 transition-colors group-hover:text-blue-500">{item.name}</h2>
                        <p className="text-sm opacity-70">
                            {item.isFolder ? 'Ketuk untuk membuka isi direktori ini' : 'Buka dokumen untuk belajar atau download'}
                        </p>
                    </div>
                    
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all group-hover:scale-110 ${item.isFolder ? 'bg-blue-600/5 text-blue-500' : 'bg-rose-600/5 text-rose-500'}`}>
                        {item.isFolder ? (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        ) : (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        )}
                    </div>
                  </div>

                  {!item.isFolder && (
                    <div className="mt-6 flex gap-2">
                        <a 
                            href={`https://drive.google.com/file/d/${item.id}/preview`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="button-secondary flex-1 !min-h-[40px] !rounded-xl !text-xs font-black uppercase tracking-widest"
                        >
                            Lihat
                        </a>
                        <a 
                            href={`https://drive.google.com/u/0/uc?id=${item.id}&export=download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="button-primary flex-1 !min-h-[40px] !rounded-xl !text-xs font-black uppercase tracking-widest shadow-none"
                        >
                            Unduh
                        </a>
                    </div>
                  )}
                  
                  {item.isFolder && (
                    <div className="mt-6">
                         <div className="button-secondary w-full !min-h-[40px] !rounded-xl !text-xs font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all">
                            Buka Folder
                         </div>
                    </div>
                  )}
                </div>
            ))
        )}
      </div>
    </div>
  )
}
