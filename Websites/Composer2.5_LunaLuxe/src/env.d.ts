/// <reference path="../.astro/types.d.ts" />

import type { SessionUser } from '@/lib/auth/session';

declare namespace App {
  interface Locals {
    user: SessionUser | null;
  }
}
