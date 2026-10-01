"""Shared helpers for the browser checks in tests/e2e (see run.sh)."""
import sys

URL = "http://localhost:8000/"
results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))


def new_page(browser, width=1280, height=900, **context_options):
    context = browser.new_context(viewport={"width": width, "height": height}, **context_options)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    return context, page, errors


def finish():
    failed = [r for r in results if not r[1]]
    for name, ok, detail in results:
        print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail and not ok else ""))
    print(f"{len(results) - len(failed)}/{len(results)} passed")
    sys.exit(1 if failed else 0)
