export interface DriveItem {
  name: string;
  driveId: string;
  isFolder: boolean;
  path: string;
}

export async function fetchDriveFolder(folderId: string): Promise<DriveItem[]> {
  try {
    const url = `https://drive.google.com/drive/folders/${folderId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) throw new Error('Failed to fetch Drive folder');
    
    const html = await response.text();
    
    // GDrive embeds data in a JSON-like structure in the HTML
    // We look for patterns like ["id", ["name", ...]]
    // A common pattern is: ["ID",["NAME",TYPE,...]]
    
    const items: DriveItem[] = [];
    
    // Extract items using regex
    // This is a simplified regex for public folders
    const regex = /\["(1[a-zA-Z0-9_-]{20,})",\["([^"]+)",(\d+)/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      const id = match[1];
      const name = match[2];
      const type = parseInt(match[3]);
      
      // Type 1 is usually folder, Type 2 is file (simplified)
      // Actually GDrive types are more complex, but we can guess from extension
      const isFolder = !name.includes('.');
      
      if (!items.find(i => i.driveId === id)) {
        items.push({
          name,
          driveId: id,
          isFolder,
          path: name
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error('GDrive Sync Error:', error);
    return [];
  }
}
