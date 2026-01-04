
import { z } from 'zod';
import { insertPlayerSchema, players, history, insertHistorySchema, gameSettings } from './schema';

export const api = {
  players: {
    list: {
      method: 'GET' as const,
      path: '/api/players',
      responses: {
        200: z.array(z.custom<typeof players.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/players',
      input: insertPlayerSchema,
      responses: {
        201: z.custom<typeof players.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/players/:id',
      input: z.object({
        score: z.number().optional(),
        name: z.string().optional(),
        order: z.number().optional(),
      }),
      responses: {
        200: z.custom<typeof players.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/players/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<typeof gameSettings.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/settings',
      input: z.object({
        penaltyValue: z.number().optional(),
        currentPlayerId: z.number().optional().nullable(),
      }),
      responses: {
        200: z.custom<typeof gameSettings.$inferSelect>(),
      },
    },
  },
  history: {
    list: {
      method: 'GET' as const,
      path: '/api/history',
      responses: {
        200: z.array(z.custom<typeof history.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/history',
      input: insertHistorySchema,
      responses: {
        201: z.custom<typeof history.$inferSelect>(),
      },
    },
    undo: {
      method: 'POST' as const,
      path: '/api/history/undo',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  actions: {
    doodshoofdeiland: {
      method: 'POST' as const,
      path: '/api/actions/doodshoofdeiland',
      input: z.object({
        currentPlayerId: z.number(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    reset: {
      method: 'POST' as const,
      path: '/api/actions/reset',
      input: z.object({ type: z.enum(['scores', 'all']) }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
