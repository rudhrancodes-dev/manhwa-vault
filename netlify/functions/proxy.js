export const handler = async (event) => {
  const { url } = event.queryStringParameters || {};

  if (!url) {
    return { statusCode: 400, body: 'url parameter required' };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { statusCode: 400, body: 'Invalid URL' };
  }

  if (parsed.protocol !== 'https:') {
    return { statusCode: 403, body: 'Only HTTPS allowed' };
  }

  // Block local/internal addresses (SSRF protection)
  if (
    /^(localhost|127\.|0\.0\.0\.0|::1|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(
      parsed.hostname
    )
  ) {
    return { statusCode: 403, body: 'Internal addresses not allowed' };
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ManhwaVault/1.0 (personal reader)',
        Accept: '*/*',
      },
    });

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json') || contentType.includes('text/')) {
      // Text/JSON response
      const text = await res.text();
      return {
        statusCode: res.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
        body: text,
      };
    } else {
      // Binary (image) response
      const buffer = await res.arrayBuffer();
      return {
        statusCode: res.status,
        headers: {
          'Content-Type': contentType || 'image/jpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
        body: Buffer.from(buffer).toString('base64'),
        isBase64Encoded: true,
      };
    }
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Proxy request failed', detail: err.message }),
    };
  }
};
