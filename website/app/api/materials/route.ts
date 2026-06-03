import { NextRequest, NextResponse } from 'next/server';

const ROOT_ID = '1LdWOImJrkJv1QxEa4465sraLavON99GV';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get('folderId') || ROOT_ID;
    
    const url = `https://drive.google.com/drive/folders/${folderId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 60 }
    });
    
    if (!response.ok) throw new Error(`Failed to fetch GDrive: ${response.status}`);
    
    const html = await response.text();
    const items: {id: string, name: string, isFolder: boolean}[] = [];
    
    // Primary extraction from window['_DRIVE_ivd']
    const dataMatch = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
    if (dataMatch && dataMatch[1]) {
        let decoded = dataMatch[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => 
            String.fromCharCode(parseInt(hex, 16))
        );
        
        try {
            const data = JSON.parse(decoded);
            const rawItems = (data && Array.isArray(data[0])) ? data[0] : [];
            
            for (const item of rawItems) {
                if (!Array.isArray(item) || item.length < 4) continue;
                const id = item[0];
                const name = item[2];
                const mimeType = item[3];
                if (typeof id === 'string' && typeof name === 'string' && id !== folderId) {
                    items.push({
                        id,
                        name,
                        isFolder: mimeType === 'application/vnd.google-apps.folder'
                    });
                }
            }
        } catch (e) { console.error('Parse error', e); }
    }
    
    // Fallback extraction if primary fails
    if (items.length === 0) {
        // More generic regex for safety
        const fallbackRegex = /\["(1[a-zA-Z0-9_-]{25,40})",\["[^"]*"\],"([^"]+)"/g;
        let m;
        while ((m = fallbackRegex.exec(html)) !== null) {
            const id = m[1];
            const name = m[2];
            if (id !== folderId && !items.find(i => i.id === id)) {
                items.push({
                    id,
                    name,
                    isFolder: !name.toLowerCase().match(/\.(pdf|jpg|png|mp3|zip|docx|xlsx)$/)
                });
            }
        }
    }

    // Secondary fallback for public folder structure pattern
    if (items.length === 0) {
        const altRegex = /\["(1[a-zA-Z0-9_-]{25,40})",\["([^"]+)"/g;
        let m;
        while ((m = altRegex.exec(html)) !== null) {
             const id = m[1];
             const name = m[2];
             if (id && name && id.length > 20 && !items.find(i => i.id === id)) {
                 items.push({ id, name, isFolder: !name.includes('.') });
             }
        }
    }

    // Filter out common UI strings that might be caught by loose regex
    const filteredItems = items.filter(i => 
        i.name && 
        i.name.length > 1 && 
        !['none', 'true', 'false', 'null', 'undefined', 'Name', 'Owner', 'Modified', 'File size'].includes(i.name)
    );

    filteredItems.sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
        return a.isFolder ? -1 : 1;
    });

    return NextResponse.json(filteredItems);
  } catch (error: any) {
    console.error('GDrive Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
