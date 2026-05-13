const MANGADEX_BASE = 'https://api.mangadex.org';

export const handler = async (event) => {
  const { path: apiPath, ...queryParams } = event.queryStringParameters || {};

  if (!apiPath) {
    return { statusCode: 400, body: JSON.stringify({ error: 'path required' }) };
  }

  // Build the upstream URL, passing all other query params through
  const upstreamParams = new URLSearchParams();
  for (const [key, val] of Object.entries(queryParams)) {
    upstreamParams.append(key, val);
  }

  // queryStringParameters flattens arrays — reconstruct from raw query string
  const rawQuery = event.rawQuery || '';
  const url = `${MANGADEX_BASE}${apiPath}${rawQuery ? '?' + rawQuery.replace(/^path=[^&]*&?/, '') : ''}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ManhwaVault/1.0 (personal reader; https://manhwa-vault.netlify.app)',
        Accept: 'application/json',
      },
    });

    const data = await res.json();

    return {
      statusCode: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Upstream request failed', detail: err.message }),
    };
  }
};
