import type { Request, Response } from 'express';

/**
 * Serverless Health Check Endpoint
 * Checks operational status of the serverless function and MAS API key configuration.
 */
export default async function handler(req: Request | any, res: Response | any) {
  const masKeyConfigured = Boolean(process.env.MAS_KEY_ID || process.env.MAS_API_KEY);

  const healthData = {
    status: 'ok',
    service: 'MAS SORA API Gateway Proxy',
    timestamp: new Date().toISOString(),
    masKeyConfigured,
    endpoints: {
      sora: '/api/sora',
      masOfficialGateway:
        'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily',
    },
    message: masKeyConfigured
      ? 'MAS KeyId is configured in environment.'
      : 'MAS_KEY_ID environment variable is missing. Set MAS_KEY_ID in .env or deployment secrets.',
  };

  // Support both Express/Node (res.status().json()) and Web Fetch standard Response
  if (res && typeof res.status === 'function') {
    return res.status(200).json(healthData);
  }

  return new Response(JSON.stringify(healthData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
