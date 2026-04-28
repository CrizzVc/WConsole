const API_KEY = '84b43625d92547c89d24fab37f0543af'; // Reemplaza con tu API Key de newsapi.org
const BASE_URL = 'https://newsapi.org/v2';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

export const fetchGamingNews = async (): Promise<NewsArticle[]> => {
  try {
    // Si estamos en Electron, preferimos usar el proceso principal para evitar bloqueos de red/CORS
    if ((window as any).electronAPI && (window as any).electronAPI.fetchNews) {
      const data = await (window as any).electronAPI.fetchNews();
      if (data.status === 'ok') {
        return data.articles.filter((article: NewsArticle) => article.urlToImage && article.title);
      }
      console.error('Error fetching news from Electron Main:', data.message);
    }

    // Fallback o modo web: fetch directo
    const response = await fetch(
      `${BASE_URL}/everything?q=videojuegos+gaming&sortBy=publishedAt&pageSize=10&apiKey=${API_KEY}`
    );
    const data = await response.json();

    if (data.status === 'ok') {
      return data.articles.filter((article: NewsArticle) => article.urlToImage && article.title);
    }

    console.error('Error fetching news:', data.message);
    return [];
  } catch (error) {
    console.error('Error in news service:', error);
    return [];
  }
};
