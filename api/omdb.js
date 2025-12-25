/**
 * Vercel Serverless Function: OMDb API Proxy
 * This hides the OMDb API key on the server side
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { i: imdbId } = req.query;

  if (!imdbId) {
    return res.status(400).json({ error: 'IMDb ID (i) parameter is required' });
  }

  // Get API key from environment variable
  const OMDB_API_KEY = process.env.OMDB_API_KEY;

  if (!OMDB_API_KEY) {
    console.error('OMDB_API_KEY not configured');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OMDb API error: ${response.status}`);
    }

    const data = await response.json();

    // Check if OMDb returned an error
    if (data.Response === 'False') {
      return res.status(404).json({
        error: 'Movie not found',
        message: data.Error
      });
    }

    // Set cache headers for better performance
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    return res.status(200).json(data);

  } catch (error) {
    console.error('OMDb API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch from OMDb',
      message: error.message
    });
  }
}
