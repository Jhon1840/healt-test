import { defineConfig } from "@playwright/test";

// dotenv SOLO en local
// import dotenv from "dotenv";
// dotenv.config();

const runId =
  process.env.RUN_ID ||
  new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .replace("T", "_");

export default defineConfig({
  testDir: "./tests",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 20000,
  fullyParallel: false,

  outputDir: `test-results/${runId}`,
  preserveOutput: "always",

  reporter: [["list"], ["blob", { outputDir: `blob-report/${runId}` }]],

  use: {
    baseURL: process.env.LOGIN_URL || "https://stage.mlx.bo",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    /* =========================
       SETUP (LOGIN)
    ========================= */
    {
      name: "setup",
      testMatch: ["**/auth.setup.spec.ts"],
    },

    /* =========================
       SMOKE (POST-DEPLOY)
    ========================= */
    {
      name: "smoke",
      dependencies: ["setup"],
      testMatch: [
        // Listings
        "**/01-listings-create.seed.spec.ts",
        "**/02-listings-edit-validar-tipos.spec.ts",
        "**/09-listings-activar-cambiar-estado.spec.ts",

        // Contactos
        "**/01-contactos-creacion-semilla.spec.ts",
        "**/02-contactos-editar-nombre.spec.ts",

        // Global search
        "**/01-global-search-acceso.spec.ts",
        "**/02-global-search-texto-simple.spec.ts",
      ],
      use: {
        storageState: "playwright/.auth/auth.json",
      },
    },

    /* =========================
       SEED
    ========================= */
    {
      name: "seed",
      dependencies: ["setup"],
      testMatch: ["**/01-listings-create.seed.spec.ts"],
      use: { storageState: "playwright/.auth/auth.json" },
    },

    /* =========================
       MÓDULOS AISLADOS
    ========================= */
    {
      name: "listings-only",
      dependencies: ["setup"],
      testMatch: ["tests/listings/(?!01-listings-create\\.seed).*\\.spec\\.ts"],
      use: { storageState: "playwright/.auth/auth.json" },
    },
    {
      name: "contacts-only",
      dependencies: ["setup"],
      testMatch: ["tests/contacts/**/*.spec.ts"],
      use: { storageState: "playwright/.auth/auth.json" },
    },
    {
      name: "global-search",
      dependencies: ["setup"],
      testMatch: ["tests/global-search/**/*.spec.ts"],
      use: { storageState: "playwright/.auth/auth.json" },
    },
  ],
});
