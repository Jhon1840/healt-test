import { Page, expect } from "@playwright/test";

export async function interceptPolygonSearch(page: Page) {
  let polygonDetected = false;

  await page.route("**/global-search/get-listings*", async (route) => {
    const url = new URL(route.request().url());
    const params = Object.fromEntries(url.searchParams.entries());

    // Simular polígono como si viniera del mapa
    params.location_by_map = "1";
    params.polygon_points = JSON.stringify({
      type: "Polygon",
      coordinates: [
        [
          [-63.185, -17.785],
          [-63.165, -17.785],
          [-63.165, -17.765],
          [-63.185, -17.765],
          [-63.185, -17.785],
        ],
      ],
    });

    polygonDetected = true;

    await route.continue({
      url:
        route.request().url().split("?")[0] +
        "?" +
        new URLSearchParams(params).toString(),
    });
  });

  return () => polygonDetected;
}
