#!/usr/bin/env python3
"""Post an image note (图文笔记) to Xiaohongshu through the creator web platform.

The login session lives in a persistent browser profile outside this repo
(~/.xhs-poster-profile by default), so you only scan the QR code once.

    python3 xhs_post.py login
    python3 xhs_post.py post --title "标题" --content "正文" --images a.jpg b.jpg --tags 摄影 日常
    python3 xhs_post.py post ... --publish      # actually click 发布

Without --publish the script fills everything in and leaves the browser open
so you can check the draft and click 发布 yourself.
"""
import argparse
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import TimeoutError as PWTimeout
from playwright.sync_api import sync_playwright

CREATOR_HOME = "https://creator.xiaohongshu.com/"
PUBLISH_URL = "https://creator.xiaohongshu.com/publish/publish?source=official"
DEFAULT_PROFILE = Path.home() / ".xhs-poster-profile"
TITLE_MAX = 20
CONTENT_MAX = 1000
IMAGES_MAX = 18


def open_context(p, profile, headless=False):
    kwargs = dict(
        user_data_dir=str(profile),
        headless=headless,
        viewport={"width": 1400, "height": 900},
        locale="zh-CN",
        args=["--disable-blink-features=AutomationControlled"],
    )
    try:
        # System Chrome looks less like a bot than the bundled Chromium.
        return p.chromium.launch_persistent_context(channel="chrome", **kwargs)
    except Exception:
        return p.chromium.launch_persistent_context(**kwargs)


def is_logged_in(page):
    return "login" not in page.url


def cmd_login(args):
    with sync_playwright() as p:
        ctx = open_context(p, args.profile)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto(CREATOR_HOME)
        print("请在打开的浏览器里扫码登录小红书创作者平台……")
        deadline = time.time() + 300
        while time.time() < deadline:
            page.wait_for_timeout(2000)
            if is_logged_in(page) and "creator.xiaohongshu.com" in page.url:
                print("登录成功，会话已保存到", args.profile)
                page.wait_for_timeout(2000)
                ctx.close()
                return 0
        print("5 分钟内没有完成登录。", file=sys.stderr)
        ctx.close()
        return 1


def click_visible(page, locator, timeout=15000):
    """Click the first visible match; the creator page renders duplicate hidden tabs."""
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        for i in range(locator.count()):
            el = locator.nth(i)
            if el.is_visible():
                el.click()
                return
        page.wait_for_timeout(300)
    raise PWTimeout("no visible element for %s" % locator)


def wait_uploads_done(page, n_images, timeout=120000):
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        uploading = page.get_by_text("上传中").count()
        if uploading == 0 and page.locator('input[placeholder*="标题"]').is_visible():
            return
        page.wait_for_timeout(1000)
    raise PWTimeout("图片上传超时（%d 张）" % n_images)


def type_content(page, editor, content, tags):
    editor.click()
    lines = content.split("\n")
    for i, line in enumerate(lines):
        if line:
            page.keyboard.insert_text(line)
        if i < len(lines) - 1:
            page.keyboard.press("Enter")
    if not tags:
        return
    page.keyboard.press("Enter")
    for tag in tags:
        # Typing "#tag" opens the topic picker; Enter picks the top suggestion,
        # which turns it into a real clickable topic instead of plain text.
        page.keyboard.type("#" + tag.lstrip("#"), delay=80)
        page.wait_for_timeout(1500)
        page.keyboard.press("Enter")
        page.wait_for_timeout(300)
        page.keyboard.type(" ")


def cmd_post(args):
    images = [Path(i).expanduser().resolve() for i in args.images]
    missing = [str(i) for i in images if not i.is_file()]
    if missing:
        print("找不到图片：", ", ".join(missing), file=sys.stderr)
        return 1
    if len(images) > IMAGES_MAX:
        print("最多 %d 张图片" % IMAGES_MAX, file=sys.stderr)
        return 1

    content = args.content or ""
    if args.content_file:
        content = Path(args.content_file).expanduser().read_text(encoding="utf-8").strip()
    if len(args.title) > TITLE_MAX:
        print("标题超过 %d 字（%d），小红书会截断或拒绝" % (TITLE_MAX, len(args.title)), file=sys.stderr)
        return 1
    if len(content) > CONTENT_MAX:
        print("正文超过 %d 字（%d）" % (CONTENT_MAX, len(content)), file=sys.stderr)
        return 1

    with sync_playwright() as p:
        ctx = open_context(p, args.profile, headless=args.headless)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto(PUBLISH_URL)
        # The redirect to /login happens client-side after the first API 401,
        # so wait for either the login page or the publish tabs to show up.
        tab = page.locator(".creator-tab", has_text="上传图文")
        for _ in range(30):
            if not is_logged_in(page) or tab.count() > 0:
                break
            page.wait_for_timeout(500)
        if not is_logged_in(page):
            print("未登录，请先运行：python3 xhs_post.py login", file=sys.stderr)
            ctx.close()
            return 1

        click_visible(page, tab)
        page.wait_for_timeout(1000)

        file_input = page.locator('input[type="file"]').first
        file_input.set_input_files([str(i) for i in images])
        print("上传 %d 张图片……" % len(images))
        wait_uploads_done(page, len(images))

        page.locator('input[placeholder*="标题"]').fill(args.title)
        editor = page.locator('[contenteditable="true"]').first
        type_content(page, editor, content, args.tags)
        print("标题和正文已填好。")

        if not args.publish:
            print("草稿已填好，请在浏览器里检查后手动点「发布」。关闭浏览器窗口即结束。")
            try:
                page.wait_for_event("close", timeout=0)
            except Exception:
                pass
            ctx.close()
            return 0

        publish_btn = page.locator("button", has_text="发布").filter(
            has_not_text="定时"
        ).last
        publish_btn.click()
        try:
            page.wait_for_url("**/publish/success**", timeout=30000)
        except PWTimeout:
            try:
                page.get_by_text("发布成功").wait_for(timeout=5000)
            except PWTimeout:
                shot = Path.cwd() / "xhs_publish_failed.png"
                page.screenshot(path=str(shot), full_page=True)
                print("没看到发布成功的提示，截图在", shot, file=sys.stderr)
                ctx.close()
                return 1
        print("发布成功 ✅")
        page.wait_for_timeout(2000)
        ctx.close()
        return 0


def main():
    ap = argparse.ArgumentParser(description="用 Playwright 发小红书图文笔记")
    ap.add_argument("--profile", type=Path,
                    default=Path(os.environ.get("XHS_PROFILE", DEFAULT_PROFILE)),
                    help="浏览器配置目录（保存登录状态），默认 ~/.xhs-poster-profile")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("login", help="打开浏览器扫码登录")

    post = sub.add_parser("post", help="发布图文笔记")
    post.add_argument("--title", required=True, help="标题（≤20 字）")
    g = post.add_mutually_exclusive_group()
    g.add_argument("--content", help="正文，可以用 \\n 换行")
    g.add_argument("--content-file", help="从 UTF-8 文本文件读取正文")
    post.add_argument("--images", nargs="+", required=True, help="图片路径，1–18 张，按顺序")
    post.add_argument("--tags", nargs="*", default=[], help="话题，不用带 #")
    post.add_argument("--publish", action="store_true", help="自动点击发布（默认只填草稿）")
    post.add_argument("--headless", action="store_true", help="无界面运行（建议配合 --publish）")

    args = ap.parse_args()
    if args.cmd == "post" and args.content:
        args.content = args.content.replace("\\n", "\n")
    return cmd_login(args) if args.cmd == "login" else cmd_post(args)


if __name__ == "__main__":
    sys.exit(main())
