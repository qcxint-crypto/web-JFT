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
      next: { revalidate: 60 } // Revalidate every minute
    });
    
    if (!response.ok) throw new Error(`Failed to fetch GDrive folder: ${response.status}`);
    
    const html = await response.text();
    
    // Improved regex to capture items in public folders
    // GDrive HTML often contains JSON-like arrays: ["ID", ["NAME", ...]]
    const items: {id: string, name: string, isFolder: boolean}[] = [];
    
    // Look for item entries
    // This regex looks for the ID and Name in the JS payload
    const itemRegex = /\["(1[a-zA-Z0-9_-]{20,})",\["([^"]+)"/g;
    let match;
    
    while ((match = itemRegex.exec(html)) !== null) {
      const id = match[1];
      const name = match[2];
      
      // Basic validation and deduplication
      if (id !== folderId && !items.find(i => i.id === id)) {
        // Heuristic: folders usually don't have file extensions
        const isFolder = !name.toLowerCase().match(/\.(pdf|jpg|png|mp3|zip|docx|xlsx)$/);
        items.push({ id, name, isFolder });
      }
    }

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('GDrive API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
