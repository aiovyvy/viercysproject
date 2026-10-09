import {
  test,
  expect,
  devices,
  type APIRequestContext,
} from "@playwright/test";
// The primary HCI demonstration: a first-time student on a phone opens a
// unique invitation, follows the optional guide, books, and is visible to staff.
async function staffInvites(request: APIRequestContext, count = 1) {
  expect(
    (
      await request.post("/api/admin/login", {
        data: { username: "manager", password: "Test-only-password-2026!" },
      })
    ).ok(),
  ).toBeTruthy();
  const response = await request.post("/api/admin/invites", {
    data: { count, label: "E2E student" },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).created as { url: string }[];
}

test("phone: invitation -> guide -> 3 nights -> Essential -> confirmation -> staff", async ({
  browser,
}) => {
  const staff = await browser.newContext();
  const [invite] = await staffInvites(staff.request);
  // Guests must not be able to mint invitations.
  const anonymous = await browser.newContext();
  expect(
    (
      await anonymous.request.post("/api/admin/invites", { data: { count: 5 } })
    ).status(),
  ).toBe(401);
  await anonymous.close();

  const phone = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await phone.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(new URL(invite.url).pathname);
  await expect(
    page.getByRole("heading", {
      name: "Your three-night Santorini escape awaits.",
    }),
  ).toBeVisible();
  await expect(page.getByText("not a real travel prize")).toBeVisible();
  await page.getByRole("button", { name: "Claim your stay" }).click();
  await expect(page).toHaveURL("/book");

  const guide = page.getByRole("region", { name: "Booking guide" });
  await expect(guide).toContainText("step 1 of 3");
  await guide.getByRole("button", { name: "Next" }).click();
  await guide.getByRole("button", { name: "Next" }).click();
  await guide.getByRole("button", { name: "Start booking" }).click();
  await expect(guide).toHaveCount(0);
  await expect(page.getByText("Demo voucher applied.")).toBeVisible();
  await expect(page.locator('[aria-current="step"]')).toContainText(
    "Dates & guests",
  );
  await page.getByRole("button", { name: "See available rooms" }).click();

  await expect(page.locator('[aria-current="step"]')).toContainText("Room");
  await expect(page.getByText("Fully covered by your voucher")).toBeVisible();
  await page.getByRole("button", { name: "Select Essential Room" }).click();

  await expect(page.locator('[aria-current="step"]')).toContainText(
    "Review & confirm",
  );
  const price = page.getByRole("region", { name: "Price breakdown" });
  await expect(price).toContainText("Demo voucher");
  await expect(price.locator(".book-price-total")).toContainText("€0.00");
  await page.getByLabel("Full name").fill("Sam Student");
  await page.getByLabel("Email address").fill("sam.student@example.test");
  await page.getByRole("checkbox", { name: /simulated booking/ }).check();
  await page.getByRole("button", { name: "Confirm demo reservation" }).click();

  await expect(page).toHaveURL(/\/booking\/VRC-[0-9A-F]+\?success=1/);
  await expect(
    page.getByRole("heading", { name: "You're booked." }),
  ).toBeVisible();
  const reference = (await page.locator(".stay-ref").innerText()).trim();
  await expect(page.getByText(/Voucher savings €540\.00/)).toBeVisible();
  await expect(
    page.getByText("Email is not configured for this demo", { exact: false }),
  ).toBeVisible();
  for (const name of ["Extend stay", "Change dates"])
    await expect(page.getByRole("button", { name })).toBeVisible();
  for (const name of ["Print receipt", "Back to home"])
    await expect(page.getByRole("link", { name })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/booking-mobile.png" });

  // A forwarded or reused link cannot redeem the voucher again.
  await page.goto(new URL(invite.url).pathname);
  await expect(
    page.getByRole("heading", { name: "This invitation has been used." }),
  ).toBeVisible();
  expect(errors).toEqual([]);

  const admin = await staff.newPage();
  await admin.goto("/admin");
  const row = admin.locator("tr").filter({ hasText: reference });
  await expect(row).toContainText("Sam Student");
  await expect(row).toContainText("Demo voucher");
  await admin.getByRole("button", { name: "Invitations", exact: true }).click();
  await expect(
    admin.locator("tr").filter({ hasText: "E2E student" }).first(),
  ).toContainText("Redeemed · " + reference);
  await phone.close();
  await staff.close();
});

test("voucher pricing for 5 Signature nights and a guest extension", async ({
  browser,
}) => {
  const staff = await browser.newContext();
  const [invite] = await staffInvites(staff.request);
  await staff.close();
  const guest = await browser.newContext();
  const token = new URL(invite.url).pathname.split("/").pop();
  expect(
    (await guest.request.post("/api/invite/claim", { data: { token } })).ok(),
  ).toBeTruthy();
  const page = await guest.newPage();
  await page.addInitScript(() =>
    window.localStorage.setItem("viercys-booking-guide-v1", "done"),
  );
  await page.goto("/book");
  await page.getByRole("button", { name: "5 nights" }).click();
  await page.getByRole("button", { name: "See available rooms" }).click();
  const signature = page.locator(".book-room").filter({
    has: page.getByRole("heading", { name: "Signature Suite" }),
  });
  // 5 x 320 - 3 x 180 = 1,060
  await expect(signature).toContainText("You pay €1,060.00");
  await signature
    .getByRole("button", { name: "Select Signature Suite" })
    .click();
  await expect(page.locator(".book-price-total")).toContainText("€1,060.00");
  await expect(page.locator(".book-price-notes")).toContainText(
    "€140.00 per night above the Essential rate",
  );
  await page.getByLabel("Full name").fill("Extension Guest");
  await page.getByLabel("Email address").fill("extend@example.test");
  await page.getByRole("checkbox", { name: /simulated booking/ }).check();
  await page.getByRole("button", { name: "Confirm demo reservation" }).click();
  await expect(
    page.getByRole("heading", { name: "You're booked." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Extend stay" }).click();
  await page
    .getByRole("button", { name: "Check price and availability" })
    .click();
  await expect(
    page.getByText("Additional simulated amount: €640.00"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm change" }).click();
  await expect(page.getByText("Your stay has been updated")).toBeVisible();
  await expect(page.locator(".book-stay dd").first()).toContainText("7 nights");
  await guest.close();
});

test("unknown invitation links explain the problem and offer a way forward", async ({
  page,
}) => {
  await page.goto("/invite/this-link-was-never-issued-xyz");
  await expect(
    page.getByRole("heading", { name: "We couldn't find this invitation." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Book without a voucher" }).click();
  await expect(page).toHaveURL("/book");
  expect(
    (
      await page.request.post("/api/invite/claim", {
        data: { token: "this-link-was-never-issued-xyz" },
      })
    ).status(),
  ).toBe(400);
});
