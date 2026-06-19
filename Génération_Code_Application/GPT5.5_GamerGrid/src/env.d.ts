/// <reference path="../.astro/types.d.ts" />

import type { PublicUser } from '@/lib/auth/types';

declare global {
  namespace App {
    interface Locals {
      user: PublicUser | null;
    }
  }
}

export {};
