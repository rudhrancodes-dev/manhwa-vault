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
  const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (
    blocked.includes(parsed.hostname) ||
    /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)
  ) {
    return { statusCode: 403, body: 'Internal addresses not allowed' };
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ManhwaVault/1.0' },
    });

    if (!res.ok) {
      return { statusCode: res.status, body: 'Upstream error' };
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
      body: Buffer.from(buffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: 'Failed to proxy image' };
  }
};
