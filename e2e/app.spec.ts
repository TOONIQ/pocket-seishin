import { test, expect } from "@playwright/test";

// Skip tutorial by clicking the skip button
async function skipTutorial(page: import("@playwright/test").Page) {
  const skip = page.getByText("スキップ");
  try {
    await skip.waitFor({ state: "visible", timeout: 2000 });
    await skip.click();
    await page.locator(".fixed.inset-0").first().waitFor({ state: "detached", timeout: 3000 });
  } catch {
    // Tutorial not shown
  }
}

// ------- Navigation -------

test.describe("Navigation", () => {
  test("bottom nav works", async ({ page }) => {
    await page.goto("/dashboard");
    await skipTutorial(page);

    await page.getByRole("link", { name: "カット" }).click();
    await expect(page).toHaveURL(/\/cuts/);

    await page.getByRole("link", { name: "予定" }).click();
    await expect(page).toHaveURL(/\/schedule/);

    // Skip stopwatch (navigation issues in dev mode)

    await page.getByRole("link", { name: "設定" }).click();
    await expect(page).toHaveURL(/\/settings/);
  });
});

// ------- Dashboard -------

test.describe("Dashboard", () => {
  test("shows empty state when no cuts", async ({ page }) => {
    await page.goto("/dashboard");
    await skipTutorial(page);
    await expect(page.getByText("カットがまだありません")).toBeVisible();
  });
});

// ------- Settings -------

test.describe("Settings", () => {
  test("can add a studio", async ({ page }) => {
    await page.goto("/settings");
    await skipTutorial(page);

    const studioSection = page.locator('[data-tutorial="studio-section"]');
    await studioSection.getByRole("button", { name: /追加/ }).click();
    await expect(page.getByPlaceholder("スタジオA")).toBeVisible();

    await page.getByPlaceholder("スタジオA").fill("テストスタジオ");
    await page.getByPlaceholder("StA").fill("テス");
    await page.getByPlaceholder("4500").fill("5000");
    await page.getByRole("button", { name: "追加", exact: true }).click();

    await expect(page.getByText("テストスタジオ")).toBeVisible();
  });

  test("can toggle theme", async ({ page }) => {
    await page.goto("/settings");
    await skipTutorial(page);

    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.getByRole("button", { name: /暗/ }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: /明/ }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});

// ------- Cut Management -------

test.describe("Cut Management", () => {
  test("can add a single cut via dialog", async ({ page }) => {
    await page.goto("/cuts");
    await skipTutorial(page);

    await page.locator('[data-tutorial="cut-add-button"]').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await dialog.getByPlaceholder("作品名").fill("テスト作品");
    // parseCutRange adds "C" prefix, so input "001" → display "C001"
    await dialog.getByPlaceholder("C001 or C001-C010").fill("001");
    await dialog.getByRole("button", { name: "追加" }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    // Cut number gets formatted as C001
    await expect(page.getByText("C001")).toBeVisible();
    await expect(page.getByText("テスト作品")).toBeVisible();
  });

  test("can add range of cuts", async ({ page }) => {
    await page.goto("/cuts");
    await skipTutorial(page);

    await page.locator('[data-tutorial="cut-add-button"]').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await dialog.getByPlaceholder("作品名").fill("範囲テスト");
    await dialog.getByPlaceholder("C001 or C001-C010").fill("010-015");
    await dialog.getByRole("button", { name: "追加" }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText("C010")).toBeVisible();
    await expect(page.getByText("C015")).toBeVisible();
  });

  test("search filters cuts", async ({ page }) => {
    await page.goto("/cuts");
    await skipTutorial(page);

    // Add a cut with unique name
    await page.locator('[data-tutorial="cut-add-button"]').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("作品名").fill("ユニーク検索");
    await dialog.getByPlaceholder("C001 or C001-C010").fill("999");
    await dialog.getByRole("button", { name: "追加" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Search hit
    await page.getByPlaceholder("カット番号・作品名で検索").fill("ユニーク");
    await expect(page.getByText("C999")).toBeVisible();

    // Search miss
    await page.getByPlaceholder("カット番号・作品名で検索").fill("存在しない");
    await expect(page.getByText("C999")).not.toBeVisible();
  });
});

// ------- Cut Detail & Status -------

test.describe("Cut Status Flow", () => {
  test("received → working → submitted → done", async ({ page }) => {
    await page.goto("/cuts");
    await skipTutorial(page);

    // Add cut
    await page.locator('[data-tutorial="cut-add-button"]').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("作品名").fill("フロー確認");
    await dialog.getByPlaceholder("C001 or C001-C010").fill("F001");
    await dialog.getByRole("button", { name: "追加" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Navigate to detail - click on the cut card
    await page.getByText("C001").first().click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/cuts\/\d+/);

    // received → working
    await page.getByText("タップでステータスを更新").click();
    await page.getByRole("button", { name: "作業開始" }).click();
    await page.waitForTimeout(500);

    // working → submitted
    await page.getByText("タップでステータスを更新").click();
    await page.getByRole("button", { name: "提出する" }).click();
    await page.waitForTimeout(500);

    // submitted → done
    await page.getByText("タップでステータスを更新").click();
    await page.getByRole("button", { name: /完了/ }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText("完了").first()).toBeVisible();
  });
});

// ------- Schedule -------

test.describe("Schedule", () => {
  test("shows week headers", async ({ page }) => {
    await page.goto("/schedule");
    await skipTutorial(page);
    await expect(page.getByText("今週")).toBeVisible();
    await expect(page.getByText("来週")).toBeVisible();
  });
});

// ------- Stopwatch -------

test.describe("Stopwatch", () => {
  test("can start and stop", async ({ page }) => {
    // Navigate to stopwatch via dashboard link (direct goto causes ERR_ABORTED in dev)
    await page.goto("/dashboard");
    await skipTutorial(page);
    await page.getByRole("link", { name: "24fps" }).click();
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "開始" }).click();
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: "停止" }).click();

    // Verify some frames were counted
    const text = await page.locator("text=/\\d+f/").first().textContent();
    expect(parseInt(text?.replace("f", "") || "0")).toBeGreaterThan(0);
  });
});

// ------- Performance -------

test.describe("Performance", () => {
  for (const p of [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Cuts", path: "/cuts" },
    { name: "Schedule", path: "/schedule" },
    { name: "Settings", path: "/settings" },
  ]) {
    test(`${p.name} loads within 3s`, async ({ page }) => {
      const start = Date.now();
      await page.goto(p.path);
      await skipTutorial(page);
      const elapsed = Date.now() - start;
      console.log(`${p.name}: ${elapsed}ms`);
      expect(elapsed).toBeLessThan(3000);
    });
  }
});
