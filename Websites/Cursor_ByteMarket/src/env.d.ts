/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    authUser: import("@/types/auth").AuthUser | null;
  }
}
