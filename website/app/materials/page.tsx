'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

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
  const [loadingContent, setLoadingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Breadcrumb path tracking
  const [history, setHistory] = useState<{id: string, name: string}[]>([{id: ROOT_ID, name: 'Utama'}])

  // Fetch root folders for sidebar
  const fetchRootFolders = useCallback(async () => {
    setLoadingSidebar(true)
    try {
      const res = await fetch(`/api/materials?folderId=${ROOT_ID}`)
      if (!res.ok) throw new Error('Gagal terhubung ke server')
      const data = await res.json()
      // Only show folders in sidebar
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
    setLoadingFiles(true)
    try {
      const res = await fetch(`/api/materials?folderId=${folderId}`)
      if (!res.ok) throw new Error('Gagal memuat isi folder')
      const data = await res.json()
      setCurrentFiles(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoadingFiles(false)
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
    
    // Manage history for breadcrumbs
    const idx = history.findIndex(h => h.id === id)
    if (idx !== -1) {
        setHistory(history.slice(0, idx + 1))
    } else {
        setHistory([...history, {id, name}])
    }
  }

  const goBack = () => {
    if (history.length > 1) {
        const prev = history[history.length - 2]
        navigateTo(prev.id, prev.name)
    }
  }

  return (
    <div className="materials-container">
      {/* Page Header */}
      <div className="mb-10 animate-fade-in">
        <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
          Materi & Latihan
        </h1>
        <p className="mt-4 text-slate-400 max-w-2xl">
          Akses modul pembelajaran, kosakata, dan soal ujian JFT langsung dari Google Drive yang selalu terupdate.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        
        {/* SIDEBAR: Folder List (Desktop) */}
        <aside className="hidden lg:block space-y-4">
          <div className="sticky top-24">
            <h2 className="mb-4 px-4 text-xs font-bold uppercase tracking-widest text-slate-500">Kategori Utama</h2>
            <nav className="flex flex-col gap-1 rounded-[24px] border border-slate-800 bg-slate-900/30 p-2">
              <button
                onClick={() => navigateTo(ROOT_ID, 'Semua Materi')}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  activeFolderId === ROOT_ID ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span className="font-bold">Beranda</span>
              </button>

              {loadingSidebar ? (
                Array.from({length: 5}).map((_, i) => (
                  <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-slate-800/40" />
                ))
              ) : (
                sidebarItems.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => navigateTo(cat.id, cat.name)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                      activeFolderId === cat.id ? 'bg-slate-800 text-blue-400 border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <svg className="h-5 w-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    <span className="font-bold truncate text-sm">{cat.name}</span>
                  </button>
                ))
              )}
            </nav>
          </div>
        </aside>

        {/* MAIN CONTENT: File Grid */}
        <main className="space-y-6">
          
          {/* Breadcrumbs / Back button */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {history.map((h, i) => (
                <div key={h.id} className="flex items-center gap-2 whitespace-nowrap">
                   {i > 0 && <span className="text-slate-700">/</span>}
                   <button 
                    onClick={() => navigateTo(h.id, h.name)}
                    className={`text-sm font-bold transition-colors ${i === history.length - 1 ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     {h.name}
                   </button>
                </div>
              ))}
            </div>
            
            {history.length > 1 && (
                <button 
                  onClick={goBack}
                  className="shrink-0 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Kembali
                </button>
            )}
          </div>

          <div className="space-y-4">
            {loadingContent ? (
               Array.from({length: 4}).map((_, i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded-[28px] bg-slate-900/50" />
               ))
            ) : currentFiles.length === 0 ? (
                <div className="rounded-[40px] border-2 border-dashed border-slate-900 py-32 text-center">
                    <p className="text-slate-600 font-bold italic">Folder ini kosong atau tidak dapat diakses.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {currentFiles.map((item) => (
                        <div 
                          key={item.id}
                          className="group flex flex-col gap-4 rounded-[28px] border border-slate-800 bg-slate-900/40 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/80 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex items-center gap-5">
                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] transition-transform group-hover:scale-105 ${item.isFolder ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                                {item.isFolder ? (
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                ) : (
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors leading-tight truncate md:max-w-md lg:max-w-lg">
                                    {item.name}
                                </h3>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    {item.isFolder ? 'Direktori Folder' : 'Dokumen PDF'}
                                </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {item.isFolder ? (
                                <button 
                                  onClick={() => navigateTo(item.id, item.name)}
                                  className="w-full rounded-2xl bg-slate-800 px-6 py-3 text-sm font-black text-white hover:bg-slate-700 transition-all active:scale-95 md:w-auto"
                                >
                                  Buka Folder
                                </button>
                            ) : (
                                <>
                                    <a 
                                      href={`https://drive.google.com/file/d/${item.id}/preview`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 rounded-2xl bg-slate-800 px-6 py-3 text-center text-sm font-black text-white hover:bg-slate-700 transition-all active:scale-95 md:flex-none md:min-w-[100px]"
                                    >
                                      Lihat
                                    </a>
                                    <a 
                                      href={`https://drive.google.com/u/0/uc?id=${item.id}&export=download`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 rounded-2xl bg-blue-600 px-6 py-3 text-center text-sm font-black text-white hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/20 md:flex-none md:min-w-[100px]"
                                    >
                                      Unduh
                                    </a>
                                </>
                            )}
                          </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .materials-container {
            padding-bottom: 2rem;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
