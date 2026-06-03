'use client'

import { useState, useEffect } from 'react'
import SiteHeader from '@/components/SiteHeader'
import staticData from './data.json'

interface DriveItem {
  id: string;
  name: string;
  isFolder: boolean;
}

const ROOT_ID = '1LdWOImJrkJv1QxEa4465sraLavON99GV';

export default function MaterialsPage() {
  const [currentFolderId, setCurrentFolderId] = useState(ROOT_ID)
  const [items, setItems] = useState<DriveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [path, setPath] = useState<{id: string, name: string}[]>([{id: ROOT_ID, name: 'Root'}])

  const fetchFolder = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`https://drive.google.com/drive/folders/${id}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      })
      const html = await res.text()
      
      const itemRegex = /\["(1[a-zA-Z0-9_-]{20,})",\["([^"]+)"/g
      let match
      const found: DriveItem[] = []
      
      while ((match = itemRegex.exec(html)) !== null) {
        const did = match[1]
        const name = match[2]
        if (did !== id && !found.find(i => i.id === did)) {
          // Heuristic for folder vs file: folders usually don't have extensions
          const isFolder = !name.toLowerCase().endsWith('.pdf') && !name.toLowerCase().endsWith('.jpg') && !name.toLowerCase().endsWith('.png')
          found.push({ id: did, name, isFolder })
        }
      }
      setItems(found)
    } catch (err) {
      console.error(err)
      // Fallback to static data for root
      if (id === ROOT_ID) {
        const fallback: DriveItem[] = Object.keys(staticData).map(cat => ({
          id: '', // We don't have subfolder IDs in static data easily without mapping
          name: cat,
          isFolder: true
        }))
        setItems(fallback)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFolder(currentFolderId)
  }, [currentFolderId])

  const navigateTo = (id: string, name: string) => {
    if (!id) return; // Fallback items don't have IDs
    setCurrentFolderId(id)
    setPath([...path, { id, name }])
  }

  const goBack = (index: number) => {
    const newPath = path.slice(0, index + 1)
    setPath(newPath)
    setCurrentFolderId(newPath[newPath.length - 1].id)
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <SiteHeader />
      
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <section className="mb-12">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              Materi & Latihan Soal
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-400">
              Sinkronisasi otomatis dengan Google Drive. Folder dan file akan diperbarui secara langsung saat Anda mengunggah ke Drive.
            </p>
          </div>

          {/* Breadcrumbs */}
          <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
            {path.map((p, i) => (
              <span key={p.id} className="flex items-center gap-2">
                <button 
                  onClick={() => goBack(i)}
                  className={`hover:text-white transition-colors ${i === path.length - 1 ? 'text-blue-400 font-bold' : ''}`}
                >
                  {p.name}
                </button>
                {i < path.length - 1 && <span>/</span>}
              </span>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-500">
                Folder kosong atau tidak dapat diakses.
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.id || item.name}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-slate-700 hover:bg-slate-900"
                >
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.isFolder ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                        {item.isFolder ? (
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        ) : (
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        )}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {item.isFolder ? 'Folder' : 'PDF Document'}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-lg font-bold text-white transition-colors group-hover:text-blue-400">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    {item.isFolder ? (
                      <button 
                        onClick={() => navigateTo(item.id, item.name)}
                        className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 transition-colors"
                      >
                        Buka Folder
                      </button>
                    ) : (
                      <>
                        <a 
                          href={`https://drive.google.com/file/d/${item.id}/preview`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-xl bg-slate-800 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-slate-700 transition-colors"
                        >
                          Lihat
                        </a>
                        <a 
                          href={`https://drive.google.com/u/0/uc?id=${item.id}&export=download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-500 transition-colors"
                        >
                          Unduh
                        </a>
                      </>
                    )}
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
