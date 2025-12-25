/**
 * Vercel Serverless Function: TMDb API Proxy
 * This hides the TMDb API key on the server side
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint, ...params } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint parameter is required' });
  }

  // Get API key from environment variable
  const TMDB_API_KEY = process.env.TMDB_API_KEY;

  if (!TMDB_API_KEY) {
    console.error('TMDB_API_KEY not configured');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Build query string with API key and other params
    const queryParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      ...params
    });

    const url = `https://api.themoviedb.org/3/${endpoint}?${queryParams}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.status}`);
    }

    const data = await response.json();

    // Set cache headers for better performance
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    return res.status(200).json(data);

  } catch (error) {
    console.error('TMDb API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch from TMDb',
      message: error.message
    });
  }
}
