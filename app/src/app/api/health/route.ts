import { NextResponse } from 'next/server';

/**
 * Health check. Public — returns minimal info for uptime monitors.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'linkedin-hub-app',
    version: process.env.npm_package_version ?? '0.1.0',
    timestamp: new Date().toISOString(),
  });
}
