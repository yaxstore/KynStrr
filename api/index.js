export default function handler(req, res) {
  res.json({
    name: 'LAYZ API Gen — V2',
    version: '2.0.0',
    status: 'online',
    platform: 'vercel-serverless',
    endpoints: {
      garena: ['GET /api/v2/gen?count=1&region=ID&name=Yax'],
      apikey: [
        'POST /api/generate  (header: x-admin-token)',
        'GET  /api/ping      (header: x-api-key)'
      ]
    }
  });
}
