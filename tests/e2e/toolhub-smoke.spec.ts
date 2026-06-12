import { expect, test } from "@playwright/test";

const admin = { username: "admin", password: "AdminPass123!" };
const member = { username: "member1", password: "MemberPass123!" };

test.describe.configure({ mode: "serial" });

test("toolhub setup, admin flows, and permission smoke", async ({ page }) => {
  await page.goto("/style-smoke-test");
  await expect(page.getByText("StyleSmokeTest")).toBeVisible();
  await expect(page.getByRole("button", { name: "默认按钮" })).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);
  await page.getByLabel("管理员用户名").fill(admin.username);
  await page.locator('input[name="password"]').fill(admin.password);
  await page.getByRole("button", { name: "创建管理员" }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);
  await expect(page.getByText("用户管理")).toBeVisible();

  const createUserForm = page.locator('form').filter({ hasText: "+ 新建用户" });
  await createUserForm.locator('input[name="username"]').fill(member.username);
  await createUserForm.locator('input[name="displayName"]').fill("测试成员");
  await createUserForm.locator('input[name="password"]').fill(member.password);
  await createUserForm.getByRole("button", { name: "+ 新建用户" }).click();
  await expect(page.getByText(member.username)).toBeVisible();

  await createUserForm.locator('input[name="username"]').fill(member.username);
  await createUserForm.locator('input[name="password"]').fill("AnotherPass123!");
  await createUserForm.getByRole("button", { name: "+ 新建用户" }).click();
  await expect(page.getByText("用户名已存在")).toBeVisible();


  await page.goto("/");
  await expect(page.getByRole("heading", { name: "产品教学" })).toBeVisible();
  await page.getByPlaceholder("搜索工具...").fill("生图");
  await page.getByRole("button", { name: "详情" }).click();
  await expect(page.getByRole("dialog", { name: /生图站 · 使用教程/ })).toBeVisible();
  await expect(page.getByText("能做什么")).toBeVisible();
  await expect(page.getByRole("link", { name: "跳转使用 →" })).toHaveAttribute("href", "/tools/gip");
  await page.getByLabel("关闭").click();

  await page.goto("/admin/api-configs");
  await expect(page.getByRole("heading", { name: /接口配置/ })).toBeVisible();
  await page.locator('input[name="note"]').first().fill("E2E 配置");
  await page.locator('input[name="baseUrl"]').first().fill("https://example.invalid/v1");
  await page.locator('input[name="apiKey"]').first().fill("test-key-not-real");
  await page.locator('input[name="models"]').first().fill("gpt-image-1");
  await page.getByRole("button", { name: "+ 新增配置" }).click();
  await expect(page.locator('tbody input[name="note"]').filter({ hasValue: "E2E 配置" })).toHaveCount(1);
  await expect(page.getByText("test-key-not-real")).toHaveCount(0);

  await page.goto("/admin/tools");
  await expect(page.getByRole("heading", { name: "工具管理" })).toBeVisible();
  await expect(page.locator('tbody input[name="name"]').first()).toHaveValue("生图站");

  await page.goto("/admin/usage?range=all");
  await expect(page.getByRole("heading", { name: "用量统计" })).toBeVisible();
  await expect(page.locator('select[name="range"]')).toHaveValue("all");

  await page.goto("/settings/password");
  await page.locator('input[name="currentPassword"]').fill("wrong-password");
  await page.locator('input[name="newPassword"]').fill("NewAdminPass123!");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("当前密码不正确")).toBeVisible();
});

test("normal user cannot enter admin", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(member.username);
  await page.locator('input[name="password"]').fill(member.password);
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/$/);
});
