import { expect, test } from "@playwright/test";

test("login and open dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Masuk ke Dashboard" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText("Ringkasan operasional")).toBeVisible();
});

test("pos checkout updates dashboard indicators", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Masuk ke Dashboard" }).click();

  await page.goto("/kasir");
  await page.getByRole("button", { name: "Tambah ke Keranjang" }).first().click();
  await page.getByRole("button", { name: "Checkout sekarang" }).click();
  await expect(page.getByText("Checkout berhasil")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("Transaksi terbaru")).toBeVisible();
});

test("inventory and debt flows stay interactive", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Masuk ke Dashboard" }).click();

  await page.goto("/inventaris");
  await page.getByRole("button", { name: "Tambah Produk" }).click();
  await page.getByLabel("Nama produk").fill("Menu Test Frontend");
  await page.getByLabel("Kategori").fill("Tes");
  await page.getByLabel("Harga beli").fill("5000");
  await page.getByLabel("Harga jual").fill("9000");
  await page.getByLabel("Stok").fill("12");
  await page.getByRole("button", { name: "Tambah produk" }).click();
  await expect(page.getByText("Menu Test Frontend")).toBeVisible();

  await page.goto("/hutang");
  await page.getByRole("button", { name: "Tambah Hutang" }).click();
  await page.getByLabel("Nama pelanggan").fill("Pak Test");
  await page.getByLabel("Nominal hutang").fill("25000");
  await page.getByRole("button", { name: "Simpan hutang" }).click();
  await expect(page.getByText("Pak Test")).toBeVisible();
});
