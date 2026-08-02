/** Upload d'images admin vers /api/upload (fichiers sur disque, pas de base64). */
export async function uploadImagesToServer(files: File[]): Promise<string[]> {
  if (files.length === 0) {
    return [];
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as { urls?: string[]; error?: string };
  if (!response.ok || !Array.isArray(data.urls)) {
    throw new Error(data.error ?? "Upload image impossible.");
  }
  return data.urls;
}
