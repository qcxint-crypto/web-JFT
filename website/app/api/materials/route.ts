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
    
    // Extraction Strategy:
    // Google Drive stores its folder content data in a global variable window['_DRIVE_ivd']
    // encoded with hex escapes (\x5b for [, \x22 for ", etc.)
    
    const items: {id: string, name: string, isFolder: boolean}[] = [];
    
    // 1. Try to find the encoded data blob
    const dataMatch = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
    if (dataMatch && dataMatch[1]) {
        // Decode hex escapes
        let decoded = dataMatch[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => 
            String.fromCharCode(parseInt(hex, 16))
        );
        
        try {
            const data = JSON.parse(decoded);
            // The data is usually a deeply nested array. 
            // In public folders, the items are often in the first element.
            const rawItems = data[0] || [];
            
            for (const item of rawItems) {
                if (!Array.isArray(item) || item.length < 4) continue;
                
                const id = item[0];
                const name = item[2];
                const mimeType = item[3];
                
                if (typeof id !== 'string' || typeof name !== 'string') continue;
                
                items.push({
                    id,
                    name,
                    isFolder: mimeType === 'application/vnd.google-apps.folder'
                });
            }
        } catch (e) {
            console.error('Failed to parse decoded GDrive data', e);
        }
    }
    
    // 2. Fallback to regex-based extraction if the above fails
    if (items.length === 0) {
        // Look for pattern: ["ID",["PARENT_ID"],"NAME","MIME_TYPE"
        const fallbackRegex = /\["(1[a-zA-Z0-9_-]{25,40})",\["[^"]*"\],"([^"]+)"/g;
        let m;
        while ((match = fallbackRegex.exec(html)) !== null) {
            const id = match[1];
            const name = match[2];
            if (id !== folderId && !items.find(i => i.id === id)) {
                items.push({
                    id,
                    name,
                    isFolder: !name.toLowerCase().includes('.')
                });
            }
        }
    }

    // Sort: Folders first, then by name
    items.sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
        return a.isFolder ? -1 : 1;
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('GDrive API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
