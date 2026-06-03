import { NextResponse } from 'next/server';

const ROOT_ID = '1LdWOImJrkJv1QxEa4465sraLavON99GV';

export async function GET() {
  try {
    const url = `https://drive.google.com/drive/folders/${ROOT_ID}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch root');
    
    const html = await response.text();
    const data: Record<string, any[]> = {};
    
    // Improved regex to find folder/file IDs and names from public GDrive HTML
    // Pattern: ["ID", ["NAME", ...]]
    // This is based on observed GDrive HTML structure for public shared folders
    const itemRegex = /\["(1[a-zA-Z0-9_-]{20,})",\["([^"]+)"/g;
    let match;
    const items: {id: string, name: string}[] = [];
    
    while ((match = itemRegex.exec(html)) !== null) {
      const id = match[1];
      const name = match[2];
      if (id !== ROOT_ID && !items.find(i => i.id === id)) {
        items.push({ id, name });
      }
    }

    // For each top-level folder found, we'll return it as a category
    // To keep it fast, we just return the categories and their IDs for now
    // or do a shallow fetch of their children if possible.
    
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}
