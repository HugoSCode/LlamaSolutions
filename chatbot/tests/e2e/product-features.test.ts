import { expect, test } from "@playwright/test";

test.describe("Product features chrome", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("header shows sync mode toggle and export instead of Deploy", async ({
    page,
  }) => {
    await expect(page.getByTestId("sync-mode-toggle")).toBeVisible();
    await expect(page.getByTestId("sync-mode-local")).toContainText(
      "本地无痕模式"
    );
    await expect(page.getByTestId("sync-mode-cloud")).toContainText(
      "云端同步模式"
    );
    await expect(page.getByTestId("export-chat-button")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Deploy with Vercel" })
    ).toHaveCount(0);
  });

  test("composer has voice input and model status dot", async ({ page }) => {
    await expect(page.getByTestId("voice-input-button")).toBeVisible();
    await expect(page.getByTestId("model-selector")).toBeVisible();
    await expect(page.getByTestId("lmstudio-status-dot")).toBeVisible();
  });

  test("switching sync mode asks how to handle the current chat", async ({
    page,
  }) => {
    await page.getByTestId("sync-mode-local").click();
    await expect(page.getByText("切换同步模式？")).toBeVisible();
    await expect(page.getByRole("button", { name: "复制当前对话" })).toBeVisible();
    await expect(page.getByRole("button", { name: "留在原处" })).toBeVisible();
    await page.getByRole("button", { name: "取消" }).click();
    await expect(page.getByText("切换同步模式？")).not.toBeVisible();
  });

  test("delete all in local mode does not call history API", async ({
    page,
  }) => {
    const historyDeletes: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "DELETE" && request.url().includes("/api/history")) {
        historyDeletes.push(request.url());
      }
    });

    await page.getByTestId("sync-mode-local").click();
    await page.getByRole("button", { name: "留在原处" }).click();
    await page.getByRole("button", { name: "Delete all" }).click();
    await page.getByRole("button", { name: "Delete All" }).click();

    expect(historyDeletes).toEqual([]);
  });

  test("local mode chat POST skips Neon persist", async ({ page }) => {
    const persistFlags: Array<boolean | undefined> = [];

    await page.route("**/api/chat", async (route) => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON() as {
          persist?: boolean;
        };
        persistFlags.push(body.persist);
      }

      await route.fulfill({
        body: "data: [DONE]\n\n",
        contentType: "text/event-stream",
        status: 200,
      });
    });

    await page.getByTestId("sync-mode-local").click();
    await page.getByRole("button", { name: "留在原处" }).click();
    await page.getByTestId("multimodal-input").fill("Local persist check");
    await page.getByTestId("send-button").click();

    await expect.poll(() => persistFlags.at(-1)).toBe(false);
  });
});
