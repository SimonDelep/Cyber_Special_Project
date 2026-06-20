import type { APIRoute } from 'astro';
import {
  fetchPosesByLevel,
  searchPoses,
} from '@/lib/yoga-api/client';
import type { YogaLevel } from '@/lib/yoga-api/types';
import { errorResponse, jsonResponse } from '@/lib/api';

export const prerender = false;

const LEVELS: YogaLevel[] = ['beginner', 'intermediate', 'expert'];

export const GET: APIRoute = async ({ url }) => {
  const level = (url.searchParams.get('level') ?? 'beginner') as YogaLevel;
  const q = url.searchParams.get('q') ?? '';
  const limit = Math.min(
    48,
    Math.max(1, Number(url.searchParams.get('limit') ?? 12)),
  );

  try {
    const poses = q.trim()
      ? await searchPoses(q, limit)
      : LEVELS.includes(level)
        ? await fetchPosesByLevel(level, limit)
        : await fetchPosesByLevel('beginner', limit);

    return jsonResponse({
      poses,
      source: 'Yoga API (alexcumplido/yoga-api)',
      attribution: 'https://github.com/alexcumplido/yoga-api',
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Could not reach the yoga poses API.';
    return errorResponse(message, 502);
  }
};
