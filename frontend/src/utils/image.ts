// src/utils/image.ts
export async function fetchWardrobeImageUrl(itemId: number, token: string): Promise<string> {
  const res = await fetch(`/wardrobe/${itemId}/file`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load image for item ${itemId}: ${res.status}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob); // temporary object URL
}
