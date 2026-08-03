import app from "../server";

export const config = {
  maxDuration: 60,
};

export default function handler(req: any, res: any) {
  if (!req.url || req.url === '/' || !req.url.startsWith('/api')) {
    req.url = '/api/health';
  }
  return app(req, res);
}
