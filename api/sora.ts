import type { Request, Response } from 'express';

const MAS_API_ENDPOINT =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

export interface MasSoraNormalizedRecord {
  date: string;
  sora: number;
  soraIndex: number;
  compounded1M: number;
  compounded3M: number;
  compounded6M: number;
  aggregateVolumeMillion?: number;
  percentile10?: number;
  percentile25?: number;
  percentile75?: number;
  percentile90?: number;
}

/**
 * Serverless MAS SORA Proxy Handler
 * Securely pulls official Monetary Authority of Singapore (MAS) overnight SORA
 * and compounded 1M/3M/6M averages using the MAS API Gateway.
 *
 * Headers forwarded to MAS:
 *   KeyId: <MAS_KEY_ID>
 */
export default async function handler(req: Request | any, res: Response | any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId');
      return res.status(204).end();
    }
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, KeyId',
      },
    });
  }

  const masKeyId = process.env.MAS_KEY_ID || process.env.MAS_API_KEY;

  if (!masKeyId) {
    const errorResponse = {
      success: false,
      error: 'MAS_KEY_ID is not configured in the server environment.',
      instruction:
        'Please define MAS_KEY_ID=<your_mas_key_id> in your .env file or hosting environment variables.',
      masEndpoint: MAS_API_ENDPOINT,
      records: [],
    };

    if (res && typeof res.status === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(503).json(errorResponse);
    }
    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    // Extract query parameters if any (e.g. limit, sort, start_date)
    const url = new URL(req.url || '/api/sora', 'http://localhost');
    const params = new URLSearchParams(url.search);

    const masUrl = new URL(MAS_API_ENDPOINT);
    params.forEach((value, key) => {
      masUrl.searchParams.set(key, value);
    });

    const masResponse = await fetch(masUrl.toString(), {
      method: 'GET',
      headers: {
        KeyId: masKeyId,
        Accept: 'application/json',
      },
    });

    if (!masResponse.ok) {
      const errorText = await masResponse.text();
      const failResponse = {
        success: false,
        status: masResponse.status,
        statusText: masResponse.statusText,
        error: `MAS API Gateway responded with HTTP ${masResponse.status}`,
        details: errorText,
      };

      if (res && typeof res.status === 'function') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(masResponse.status).json(failResponse);
      }
      return new Response(JSON.stringify(failResponse), {
        status: masResponse.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const rawData = await masResponse.json();

    // MAS API returns records inside an array or under result.records / data
    const recordsArray = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.result?.records)
      ? rawData.result.records
      : Array.isArray(rawData?.records)
      ? rawData.records
      : [];

    // Normalize MAS API fields into standardized SORA record format
    const normalizedRecords: MasSoraNormalizedRecord[] = recordsArray.map((r: any) => {
      const date =
        r.end_of_day ||
        r.endOfDay ||
        r.date ||
        r.as_of_date ||
        r.eod ||
        '';

      const sora = parseFloat(r.sora ?? r.daily_sora ?? r.sora_rate ?? 0);
      const soraIndex = parseFloat(r.sora_index ?? r.comp_sora_index ?? r.soraIndex ?? 1.15);
      const compounded1M = parseFloat(r.comp_sora_1m ?? r.compounded_sora_1m ?? r.sora_1m ?? sora);
      const compounded3M = parseFloat(r.comp_sora_3m ?? r.compounded_sora_3m ?? r.sora_3m ?? sora);
      const compounded6M = parseFloat(r.comp_sora_6m ?? r.compounded_sora_6m ?? r.sora_6m ?? sora);
      const aggregateVolumeMillion = r.aggregate_volume
        ? parseFloat(r.aggregate_volume)
        : undefined;

      return {
        date,
        sora: isNaN(sora) ? 0 : sora,
        soraIndex: isNaN(soraIndex) ? 1.15 : soraIndex,
        compounded1M: isNaN(compounded1M) ? sora : compounded1M,
        compounded3M: isNaN(compounded3M) ? sora : compounded3M,
        compounded6M: isNaN(compounded6M) ? sora : compounded6M,
        aggregateVolumeMillion,
        percentile10: r.percentile_10 ? parseFloat(r.percentile_10) : undefined,
        percentile25: r.percentile_25 ? parseFloat(r.percentile_25) : undefined,
        percentile75: r.percentile_75 ? parseFloat(r.percentile_75) : undefined,
        percentile90: r.percentile_90 ? parseFloat(r.percentile_90) : undefined,
      };
    });

    const successResponse = {
      success: true,
      source: 'Monetary Authority of Singapore (MAS) Gateway',
      count: normalizedRecords.length,
      records: normalizedRecords,
      rawCount: recordsArray.length,
    };

    if (res && typeof res.status === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(successResponse);
    }

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    const errorBody = {
      success: false,
      error: error?.message || 'Failed to connect to MAS SORA API Gateway',
    };

    if (res && typeof res.status === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(500).json(errorBody);
    }

    return new Response(JSON.stringify(errorBody), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
