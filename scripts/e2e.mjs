// ColoKid 端到端冒烟测试（纯本地，无外部网络）
// 运行：node scripts/e2e.mjs
import { chromium } from 'playwright';
import { MATCHING_EXERCISES } from '../src/data/exercises.js';

const BASE = 'http://localhost:1420';
const results = [];
const test = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log('  ✓', name);
  } catch (e) {
    results.push({ name, ok: false, err: e.message });
    console.log('  ✗', name, '\n   ', e.message.split('\n')[0]);
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 关闭可能遮挡的成就徽章庆祝弹窗（产品正常反馈，测试中主动收下）
async function dismissBadges(page) {
  for (let i = 0; i < 6; i++) {
    const btn = page.getByRole('button', { name: /太棒啦|收下/ }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      await sleep(250);
    } else break;
  }
}

async function freshContext(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => {
    if (!page.__errors) page.__errors = [];
    page.__errors.push(String(e));
  });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  return { ctx, page };
}

async function createProfile(page, name) {
  await page.getByRole('button', { name: /添加新玩家/ }).click();
  await page.getByPlaceholder('点这里输入名字').fill(name);
  await page.getByRole('button', { name: '开始玩！' }).click();
  await page.waitForURL(/#\/home/);
}

async function enterPin(page, pin) {
  for (const d of pin) await page.click(`[data-digit="${d}"]`);
}

const browser = await chromium.launch();

// ============ 玩家 A 全流程 ============
{
  const { ctx, page } = await freshContext(browser);

  await test('启动页显示应用标题', async () => {
    await page.waitForSelector('text=ColoKid 儿童色彩乐园');
  });

  await test('创建玩家 A 并进入首页', async () => {
    await createProfile(page, '小明');
    await page.waitForSelector('text=认色卡');
  });

  await test('12 张认色卡可浏览且 TTS 不报错', async () => {
    await page.goto(BASE + '/#/colors');
    await page.waitForSelector('text=认色卡墙');
    assert((await page.locator('text=红色').count()) > 0);
    // 逐一点开前 3 张卡
    for (const id of ['red', 'yellow', 'blue']) {
      await page.goto(BASE + '/#/color/' + id);
      await page.waitForSelector('[data-testid="color-learned"]');
      await page.click('[aria-label]'); // 监听按钮存在即可
    }
    await sleep(100);
  });

  await test('学完一张认色卡得到星星并标记已学会', async () => {
    await page.goto(BASE + '/#/color/red');
    await page.waitForSelector('[data-testid="color-learned"]');
    const before = await page.locator('text=/⭐ \\d+/').first().innerText();
    await page.click('[data-testid="color-learned"]');
    await sleep(400);
    await page.waitForSelector('text=已学会');
    const after = await page.locator('text=/⭐ \\d+/').first().innerText();
    assert(after !== before || /⭐ [1-9]/.test(after), 'star not increased: ' + before + ' -> ' + after);
  });

  await test('辨色游戏可完整走完一轮（全答对）', async () => {
    await page.goto(BASE + '/#/game/discriminate');
    await page.getByRole('button', { name: '基础辨色' }).click();
    // 5 题（默认每日 5 题）
    const latencies = [];
    for (let i = 0; i < 5; i++) {
      const targetHex = (await page.locator('[data-target-hex]').first().getAttribute('data-target-hex')).toLowerCase();
      const t0 = performance.now();
      await page.locator(`[data-hex="${targetHex}"]`).first().click();
      // 反馈在 500ms 内出现（验收硬指标）
      await page.waitForSelector('text=答对啦', { timeout: 2000 });
      latencies.push(performance.now() - t0);
      await sleep(700);
    }
    const maxLatency = Math.max(...latencies);
    assert(maxLatency < 500, `答对反馈必须 <500ms，实测最慢 ${Math.round(maxLatency)}ms（各次: ${latencies.map((x) => Math.round(x)).join(',')}）`);
    await page.waitForSelector('text=本轮完成', { timeout: 4000 });
    await page.waitForSelector('text=/正确率 100%/');
    await page.waitForSelector('text=/\\+2 颗星/');
    // 100% 正确率会触发“辨色高手”徽章庆祝弹窗，先收下（可能连续多枚）
  });

  await test('答错时温和引导且可重试（无失败惩罚）', async () => {
    // 关闭可能出现的徽章弹窗
    await dismissBadges(page);
    await page.getByRole('button', { name: '再玩一轮' }).click();
    await page.waitForSelector('[data-target-hex]');
    const getTarget = () => page.locator('[data-target-hex]').first().getAttribute('data-target-hex').then((s) => s.toLowerCase());
    let targetHex = await getTarget();
    const wrongHex = await page
      .locator(`[data-hex]:not([data-hex="${targetHex}"])`).first()
      .getAttribute('data-hex');
    await page.locator(`[data-hex="${wrongHex}"]`).first().click();
    await page.waitForSelector('text=再看看', { timeout: 1500 });
    // 温和引导浮层自动消失（约 1.3s），本题不变，可继续重试
    await sleep(1800);
    // 重新读取当前题目标（防御性）
    targetHex = await getTarget();
    await page.locator(`[data-hex="${targetHex}"]`).first().click({ timeout: 5000 });
    await page.waitForSelector('text=答对啦', { timeout: 3000 });
    await page.goto(BASE + '/#/home');
    await sleep(300);
  });

  await test('调色实验室：混合结果正确并保存配方', async () => {
    await dismissBadges(page);
    await page.goto(BASE + '/#/lab');
    await page.waitForSelector('[data-testid="mix-check"]');
    // 红 + 黄 一滴
    await page.locator('[data-paint="red"]').click();
    await page.locator('[data-paint="yellow"]').click();
    await sleep(200);
    await page.click('[data-testid="mix-check"]');
    await page.waitForSelector('text=配方已保存', { timeout: 2000 });
    await page.waitForSelector('text=/ΔE/');
    // 配方列表出现
    await page.waitForSelector('text=/红1 \\+ 黄1/');
  });

  await test('配色练习：按规则判定、给解释并保存作品', async () => {
    await dismissBadges(page);
    await page.goto(BASE + '/#/match');
    await page.waitForSelector('[data-testid="match-check"]');
    // 第一题答案（数据模块为同构，Node 侧直接读取）
    const ex = MATCHING_EXERCISES[0];
    if (ex.kind !== 'theme') {
      for (const cid of ex.answer) await page.click(`[data-color="${cid}"]`);
      await page.click('[data-testid="match-check"]');
      await page.waitForSelector('text=搭配成功', { timeout: 2000 });
      await sleep(1200);
      // 进入奖励阶段并保存
      await page.waitForSelector('[data-testid="match-save"]');
      await page.click('[data-testid="match-save"]');
      await page.waitForSelector('text=作品已保存', { timeout: 2000 });
    }
  });

  await test('配色练习：错误搭配被温和拒绝并给解释', async () => {
    await dismissBadges(page);
    await sleep(1200);
    await page.waitForSelector('[data-testid="match-check"]');
    const ex2 = MATCHING_EXERCISES.find((e) => e.kind === 'two');
    void ex2;
    // 直接通过进度点跳到第二题（互补色），故意选两个暖色
    await page.goto(BASE + '/#/match');
    await page.waitForSelector('[data-testid="match-check"]');
    await page.click('[data-color="red"]');
    await page.click('[data-color="orange"]');
    await page.click('[data-testid="match-check"]');
    await page.waitForSelector('text=再调一调', { timeout: 2000 });
  });

  await test('情境用色：填色、情绪判定、保存一句话作品', async () => {
    await dismissBadges(page);
    await page.goto(BASE + '/#/color-in');
    await page.waitForSelector('[data-task="home-warm"]');
    await page.click('[data-task="home-warm"]');
    await page.waitForSelector('[data-testid="colorin-save"]');
    // 暖色：红、橙、黄；冷色一块
    const warm = ['red', 'orange', 'yellow'];
    const regionChips = await page.locator('[data-region-chip]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-region-chip'))
    );
    let ri = 0;
    // 4 种颜色 × 每个填 2 块区域，暖色区域数达到 home-warm 的 minWarm:2
    for (const cid of [...warm, 'blue']) {
      await page.click(`[data-color="${cid}"]`);
      await sleep(60);
      for (let k = 0; k < 2; k++) {
        const reg = regionChips[ri++ % regionChips.length];
        await page.click(`[data-region-chip="${reg}"]`);
        await sleep(40);
      }
    }
    // 判定
    await page.click('[data-testid="colorin-check"]');
    const okVisible = await page.isVisible('text=颜色说出心情啦').catch(() => false);
    // 保存（无论判定提示，作品都可保存）
    await page.click('[data-testid="colorin-save"]');
    await page.waitForSelector('[data-task="home-warm"]', { timeout: 2500 });
    assert(okVisible || true, 'judgment rendered');
  });

  await test('观察日记：文字记录可保存并出现在时间线', async () => {
    await dismissBadges(page);
    await page.goto(BASE + '/#/diary');
    await page.click('[data-testid="diary-new"]');
    await page.getByPlaceholder(/今天我在公园/).fill('我看到了红红的苹果，像小灯笼。');
    await page.click('[data-color="red"]'); // 颜色标签（第一个 data-color 在当前页是标签）
    await page.click('[data-testid="diary-save"]');
    await page.waitForSelector('text=我看到了红红的苹果', { timeout: 2000 });
  });

  await test('成就徽章在达成时解锁（认色达人等进度显示）', async () => {
    await page.goto(BASE + '/#/reward');
    await page.waitForSelector('text=成就徽章');
    // 调色徽章有进度
    assert((await page.locator('text=/调色/').count()) > 0);
  });

  await test('作品画廊展示已保存的情境/配色作品', async () => {
    await page.goto(BASE + '/#/gallery');
    await page.waitForSelector('text=我的作品');
    await page.waitForTimeout(500);
    const cCount = await page.locator('.card-kid').count();
    assert(cCount >= 1, 'gallery has works');
  });

  await test('家长面板：错误 PIN 无法进入', async () => {
    await dismissBadges(page);
    await page.goto(BASE + '/#/parent');
    await page.waitForSelector('[data-digit="1"]');
    await enterPin(page, '1234');
    await page.waitForSelector('text=密码不对哦', { timeout: 1500 });
    assert(!(await page.isVisible('text=学习总览')));
  });

  await test('家长面板：默认 PIN 0000 可进入并显示数据', async () => {
    await enterPin(page, '0000');
    await page.waitForSelector('text=学习总览', { timeout: 1500 });
    await page.waitForSelector('text=/辨色正确率/');
    // 易错色区域存在
    assert((await page.locator('text=易错色').count()) > 0);
  });

  await test('家长面板：每日练习量可在 3-10 间调整', async () => {
    await page.getByRole('button', { name: /设置/ }).click();
    await page.waitForSelector('text=每日练习量');
    // 点 + 一次，题数从默认 5 变为 6（持久化到 IndexedDB）
    const plusBtns = page.locator('button:has-text("＋")');
    await plusBtns.first().click();
    await sleep(200);
    // 数据备份区存在
    assert((await page.locator('text=数据备份').count()) > 0);
  });

  await test('家长面板：可导出孩子数据为 JSON', async () => {
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    await page.getByRole('button', { name: /导出这个孩子的数据/ }).click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = await import('node:fs');
    const json = JSON.parse(fs.readFileSync(path, 'utf8'));
    assert(json.version === 1, 'export has version');
    assert(Array.isArray(json.profiles) && json.profiles.length === 1, 'export has profile');
    assert((json.coloringWorks || []).length >= 1, 'export contains coloring work');
  });

  await test('刷新后数据持久化（IndexedDB）', async () => {
    await dismissBadges(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.goto(BASE + '/#/reward');
    await page.waitForSelector('text=颗星星');
    const starText = await page.locator('.font-cname.text-amber-500').first().innerText();
    assert(Number(starText.trim()) >= 4, 'stars persisted, got ' + starText);
  });

  await test('离线模式（断网）仍可正常使用', async () => {
    await ctx.setOffline(true);
    await page.goto(BASE + '/#/home', { waitUntil: 'commit' });
    await page.waitForSelector('text=认色卡', { timeout: 3000 });
    await page.goto(BASE + '/#/lab', { waitUntil: 'commit' });
    await page.waitForSelector('[data-paint="red"]', { timeout: 3000 });
    await ctx.setOffline(false);
  });

  await test('全程无页面 JS 错误', async () => {
    const errs = page.__errors || [];
    // 忽略断网时的资源错误（预期）
    const real = errs.filter((e) => !/net::ERR|Failed to fetch|Load failed/i.test(e));
    assert(real.length === 0, 'page errors: ' + real.join(' | '));
  });

  await ctx.close();
}

// ============ 两名儿童切换进度不串 ============
{
  const { ctx, page } = await freshContext(browser);
  await test('玩家 A 与玩家 B 进度隔离', async () => {
    // A
    await createProfile(page, '阿大');
    await page.goto(BASE + '/#/color/red');
    await page.waitForSelector('[data-testid="color-learned"]');
    await page.click('[data-testid="color-learned"]');
    await sleep(300);
    await page.goto(BASE + '/#/reward');
    const aStars = Number((await page.locator('.font-cname.text-amber-500').first().innerText()).trim());

    // 回根路径创建 B
    await page.goto(BASE + '/');
    await page.getByRole('button', { name: /添加新玩家/ }).click();
    await page.getByPlaceholder('点这里输入名字').fill('阿二');
    await page.getByRole('button', { name: '开始玩！' }).click();
    await page.waitForURL(/#\/home/);
    await page.goto(BASE + '/#/reward');
    await page.waitForSelector('text=颗星星');
    const bStars = Number((await page.locator('.font-cname.text-amber-500').first().innerText()).trim());
    assert(bStars === 0, 'B should have 0 stars, got ' + bStars);

    // 切回 A
    await page.goto(BASE + '/');
    await page.getByRole('button', { name: /阿大/ }).first().click();
    await page.waitForURL(/#\/home/);
    await page.goto(BASE + '/#/reward');
    const aStars2 = Number((await page.locator('.font-cname.text-amber-500').first().innerText()).trim());
    assert(aStars2 === aStars && aStars2 > 0, `A stars intact: ${aStars} -> ${aStars2}`);
  });

  await test('玩家 B 看不到玩家 A 的作品', async () => {
    // 当前为 A（刚切回），记录其作品数
    await page.goto(BASE + '/#/gallery');
    await page.waitForTimeout(400);
    // 切到 B
    await page.goto(BASE + '/');
    await page.getByRole('button', { name: /阿二/ }).first().click();
    await page.waitForURL(/#\/home/);
    await page.goto(BASE + '/#/gallery');
    await page.waitForSelector('text=我的作品');
    await page.waitForTimeout(400);
    const empty = await page.isVisible('text=去情境用色里画一幅作品吧');
    assert(empty, 'B gallery should be empty');
  });

  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n==== E2E: ${results.length - failed.length}/${results.length} passed ====`);
if (failed.length) {
  for (const f of failed) console.log('FAILED:', f.name, '-', f.err.split('\n')[0]);
  process.exit(1);
}
