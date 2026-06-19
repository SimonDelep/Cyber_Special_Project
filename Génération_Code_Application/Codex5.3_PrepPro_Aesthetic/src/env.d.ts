/// <reference path="../.astro/types.d.ts" />

import type { PublicUser } from "@/lib/auth/types";

declare namespace App {
  interface Locals {
    user: PublicUser | null;
  }
}
