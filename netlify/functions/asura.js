const ASURA_API = 'https://api.asurascans.com';

export const handler = async (event) => {
  const { path: apiPath } = event.queryStringParameters || {};

  if (!apiPath) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'path parameter required' }),
    };
  }

  const url = `${ASURA_API}${apiPath}`;

  try {
    const res = await fetch(url, {
      headers: {
        Origin: 'https://asurascans.com',
        Referer: 'https://asurascans.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });

    const data = await res.json();

    return {
      statusCode: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=120',
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
