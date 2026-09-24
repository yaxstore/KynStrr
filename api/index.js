export default function handler(req, res) {
  res.json({
    name: 'LAYZ API Gen — JWT Edition',
    version: '2.0.0',
    status: 'online',
    platform: 'vercel-serverless',
    auth_type: 'JWT Stateless',
    endpoints: {
      admin: [
        'POST /api/generate  (header: x-admin-token)'
      ],
      user: [
        'GET /api/ping    (header: x-api-key)',
        'GET /api/verify  (header: x-api-key)'
      ]
    },
    docs: 'https://github.com/USERNAME/api-gen-jwt'
  });
}
