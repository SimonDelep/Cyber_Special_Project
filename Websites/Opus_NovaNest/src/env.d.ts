/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { SafeUser } from './lib/db/schema';

interface ImportMetaEnv {
  readonly DATABASE_URL?: string;
  readonly AUTH_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user: SafeUser | null;
  }
}
