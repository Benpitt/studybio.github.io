/**
 * Serverless function to proxy SAT questions API
 * This bypasses CORS restrictions by making the API call server-side
 */

export default async function handler(req, res) {
  // Enable CORS for all origins (you can restrict this to your domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the domain parameter from query string
    const { domains } = req.query;

    if (!domains) {
      return res.status(400).json({
        error: 'Missing required parameter: domains',
        usage: 'Example: /api/sat-questions?domains=H'
      });
    }

    // Validate domain code
    const validDomains = ['H', 'P', 'A', 'G', 'I', 'C', 'E', 'S'];
    if (!validDomains.includes(domains.toUpperCase())) {
      return res.status(400).json({
        error: 'Invalid domain code',
        validDomains: {
          'H': 'Heart of Algebra',
          'P': 'Problem-Solving and Data Analysis',
          'A': 'Advanced Math',
          'G': 'Geometry and Trigonometry',
          'I': 'Information and Ideas',
          'C': 'Craft and Structure',
          'E': 'Expression of Ideas',
          'S': 'Standard English Conventions'
        }
      });
    }

    // Fetch from the PracticeSAT API
    const apiUrl = `https://practicesat.vercel.app/api/get-questions?domains=${domains.toUpperCase()}`;
    console.log('Fetching from:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'studying.works/1.0',
      },
    });

    if (!response.ok) {
      console.error('API error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'Failed to fetch from PracticeSAT API',
        status: response.status,
        statusText: response.statusText
      });
    }

    const data = await response.json();
    console.log('Successfully fetched questions for domain:', domains);

    // Return the data with cache headers for better performance
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
