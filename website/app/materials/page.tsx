'use client'

import { useState, useEffect, useCallback } from 'react'
import staticData from './data.json'

interface DriveItem {
  id: string;
  name: string;
  isFolder: boolean;
}

const ROOT_ID = '1LdWOImJrkJv1QxEa4465sraLavON99GV';

export default function MaterialsPage() {
  const [categories, setCategories] = useState<DriveItem[]>([])
  const [activeFolderId, setActiveFolderId] = useState<string>('')
  const [activeFolderName, setActiveFolderName] = useState<string>('')
  const [files, setFiles] = useState<DriveItem[]>([])
  const [loadingSidebar, setLoadingSidebar] = useState(true)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch root categories
  const fetchCategories = useCallback(async () => {
    setLoadingSidebar(true)
    try {
      const res = await fetch(`/api/materials?folderId=${ROOT_ID}`)
      if (!res.ok) throw new Error('Gagal memuat kategori')
      const data = await res.json()
      // Sort: Folders first
      const folders = data.filter((i: DriveItem) => i.isFolder).sort((a: any, b: any) => a.name.localeCompare(b.name))
      setCategories(folders)
      
      // Set first folder as active by default if not set
      if (folders.length > 0 && !activeFolderId) {
        setActiveFolderId(folders[0].id)
        setActiveFolderName(folders[0].name)
      }
    } catch (err: any) {
      setError(err.message)
      // Fallback to static keys if API fails
      const fallback = Object.keys(staticData).map(name => ({ id: '', name, isFolder: true }))
      setCategories(fallback)
    } finally {
      setLoadingSidebar(false)
    }
  }, [activeFolderId])

  // Fetch files in active folder
  const fetchFiles = useCallback(async (folderId: string) => {
    if (!folderId) {
        // Handle static fallback data
        const staticFiles = (staticData as any)[activeFolderName] || []
        setFiles(staticFiles.map((f: any) => ({ 
            id: f.driveId, 
            name: f.name, 
            isFolder: false 
        })))
        return
    }

    setLoadingFiles(true)
    try {
      const res = await fetch(`/api/materials?folderId=${folderId}`)
      if (!res.ok) throw new Error('Gagal memuat file')
      const data = await res.json()
      setFiles(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoadingFiles(false)
    }
  }, [activeFolderName])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (activeFolderId || (categories.length > 0 && !activeFolderId)) {
        fetchFiles(activeFolderId)
    }
  }, [activeFolderId, fetchFiles, categories])

  const handleFolderClick = (id: string, name: string) => {
    setActiveFolderId(id)
    setActiveFolderName(name)
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 fade-up">
        <h1 className="text-4xl font-black tracking-tighter text-white md:text-6xl">
          Materi & Latihan Soal
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-400">
          Lihat langsung di browser atau download untuk belajar offline. Semua materi dipisahkan berdasarkan kategori untuk memudahkan pencarian.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
        {/* Sidebar - Categories */}
        <aside className="space-y-4">
          <div className="rounded-[24px] border border-slate-800 bg-slate-900/40 p-2">
            {loadingSidebar ? (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-slate-800" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => handleFolderClick(cat.id, cat.name)}
                    className={`flex items-center justify-between rounded-xl px-5 py-4 text-left transition-all hover:bg-slate-800/50 ${
                      activeFolderName === cat.name 
                        ? 'bg-slate-800 text-white ring-1 ring-slate-700 shadow-xl' 
                        : 'text-slate-400'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block font-bold truncate">{cat.name}</span>
                      {/* Sub-info if we had it */}
                    </div>
                    {activeFolderName === cat.name && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="hidden rounded-[24px] bg-blue-600/10 p-6 lg:block">
            <p className="text-sm font-medium text-blue-400">
              💡 Tip: Gunakan tombol "Lihat" untuk membuka PDF langsung di browser tanpa mendownload.
            </p>
          </div>
        </aside>

        {/* Main Content - Files */}
        <main>
          <div className="mb-6 flex items-center justify-between">
            <div className="fade-in">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Kategori</span>
              <h2 className="text-3xl font-black text-white">{activeFolderName || 'Pilih Kategori'}</h2>
            </div>
          </div>

          <div className="space-y-3">
            {loadingFiles ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 w-full animate-pulse rounded-[24px] bg-slate-900/50" />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="rounded-[32px] border-2 border-dashed border-slate-800 py-20 text-center text-slate-500">
                Tidak ada file di folder ini.
              </div>
            ) : (
              files.map((file) => (
                <div 
                  key={file.id || file.name}
                  className="group flex flex-col gap-4 rounded-[24px] border border-slate-800 bg-slate-900/40 p-6 transition-all hover:border-slate-700 hover:bg-slate-900/60 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${file.isFolder ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {file.isFolder ? (
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                      ) : (
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white transition-colors group-hover:text-blue-400">
                        {file.name}
                      </h3>
                      {!file.isFolder && (
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Dokumen PDF</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {file.isFolder ? (
                      <button 
                        onClick={() => handleFolderClick(file.id, file.name)}
                        className="rounded-[16px] bg-slate-800 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-700 active:scale-95"
                      >
                        Buka Subfolder
                      </button>
                    ) : (
                      <>
                        <a 
                          href={`https://drive.google.com/file/d/${file.id}/preview`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-[16px] bg-slate-800 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-700 active:scale-95"
                        >
                          Lihat
                        </a>
                        <a 
                          href={`https://drive.google.com/u/0/uc?id=${file.id}&export=download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-[16px] bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-900/20"
                        >
                          Download
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
