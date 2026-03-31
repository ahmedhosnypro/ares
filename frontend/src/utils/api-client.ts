/**
 * Generic API Fetcher for both Server and Client components
 * The <T> makes it dynamically typed, so no more 'any' errors!
 */
export async function fetchData<T>(endpoint: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${baseUrl}${endpoint}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  // Here we cast the raw json (which is 'any') to our specific type <T>
  return (await response.json()) as T;
}