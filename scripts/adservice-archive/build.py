"""Rebuild the six Adservice blog posts as static pages.

Text: the post fields captured by the Wayback Machine (ext/*.json, see extract step).
Layout + images: the AdserviceCom repo (blog_article.html structure, app/static).
Usage: python3 -I build.py <scratch dir> <AdserviceCom/app/static> <out dir>
"""
import html
import json
import re
import shutil
import sys
from pathlib import Path

scratch, static, out = map(Path, sys.argv[1:4])
assets = out / "assets"
assets.mkdir(parents=True, exist_ok=True)

SNAPSHOTS = {
    "adservices-magento-tracking-extension-has-arrived": "20240804080624",
    "new-shopify-plugin-update": "20231206204653",
    "updated-google-ads-tool": "20240911184013",
    "case-miomio-16000-unikke-besgende-til-miomios-webshop": "20231206204042",
    "affiliate-marketing-en-win-win-situation": "20240911205027",
    "vil-du-n-flere-kunder-ge-din-eksponering-online-og-kun-betale-pr-salg": "20231004101123",
}

# Dead email-CDN image (matched by filename) -> replacement from the repo's static/.
# None = the original is gone everywhere (CDN 404, never archived), so the <img> is dropped.
IMAGE_MAP = {
    "logo130.png": "images/adservice_logo.png",
    "adservice_logo.png": "images/adservice_logo.png",
    "8298292917_magentologotransparentpngpng.jpeg": "images/logo-magento.png",
    "shopify_logo_czX.png": "images/logo-shopify.png",
    "google-advertising.png": "images/google-ads.png",
    "facebook-circle-black.png": "images/logoFacebook.svg",
    "instagram-circle-black.png": "images/logoInstagram.svg",
    "linkedin-circle-black.png": "images/logoLinkedIN.svg",
    "miomio.png": None,
    "macbook_air_qnH.png": None,
    # ponytail: DALL-E filename is truncated in the source, match by prefix below
}
LOCAL = {"T0TA535S6-UV9K9M81E-fb29478f93fa-512": scratch / "img/slack-avatar.jpg"}

for f in ("css/quill.snow.css", "js/quill.min.js"):
    shutil.copy(static / f, assets / Path(f).name)


def replace_img(m):
    tag, src = m.group(0), m.group(1)
    name = src.rsplit("/", 1)[-1]
    if name in LOCAL:
        shutil.copy(LOCAL[name], assets / "slack-avatar.jpg")
        return tag.replace(src, "../assets/slack-avatar.jpg")
    if name.startswith("dalle_"):
        replace_img.dropped += 1
        return ""
    if name not in IMAGE_MAP:
        raise SystemExit(f"unmapped image: {src}")
    repo_path = IMAGE_MAP[name]
    if repo_path is None:
        replace_img.dropped += 1
        return ""
    shutil.copy(static / repo_path, assets / Path(repo_path).name)
    # Repo logos have their own aspect ratio; let height follow width.
    tag = re.sub(r'\sheight="\d+"', "", tag)
    return tag.replace(src, "../assets/" + Path(repo_path).name)


PAGE = """<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · Adservice blog (archived)</title>
<meta name="description" content="{title}. Originally published on the Adservice blog, {date}. Archived copy.">
<link rel="canonical" href="{wayback}">
<link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i&display=swap" rel="stylesheet">
{extra_head}
<style>
  body {{ margin: 0; font-family: Lato, sans-serif; color: #333; background: #fff; }}
  .archive-note {{ background: #f4f6f8; border-bottom: 1px solid #e1e5ea; font-size: 14px; line-height: 1.5; }}
  .archive-note p {{ max-width: 880px; margin: 0 auto; padding: 14px 16px; }}
  .container {{ max-width: 880px; margin: 0 auto; padding: 30px 16px 60px; }}
  .back {{ display: inline-block; margin-bottom: 20px; color: #1a73e8; }}
  .blog-title {{ font-size: 2rem; line-height: 1.2; margin: 0 0 15px; }}
  .splitter {{ height: 3px; width: 60px; background: #e1e5ea; margin-bottom: 15px; }}
  .blog-details {{ color: #666; margin: 0 0 30px; }}
  #preview .ql-editor {{ padding: 0; font-size: 16px; line-height: 1.6; }}
  img {{ max-width: 100%; }}
</style>
</head>
<body>
<aside class="archive-note"><p>
  Archived copy. I wrote this for the Adservice blog ({date}). Adservice has since merged into
  Adtraction and adservice.com is gone, so this page was rebuilt from the
  <a href="{wayback}">Internet Archive snapshot</a> and the original site's code.{lost}
</p></aside>
<main class="container">
  <a class="back" href="../../../">← Back to portfolio</a>
  <h1 class="blog-title">{title}</h1>
  <div class="splitter"></div>
  <p class="blog-details">{category}, written by <b>{author}</b> on {date}</p>
  {body}
</main>
{extra_tail}
</body>
</html>
"""

QUILL_TAIL = """<script src="../assets/quill.min.js"></script>
<script>
  // Same render path as the original blog_article.html: read-only Quill over the stored delta.
  var quill = new Quill('#preview', { modules: { toolbar: [] }, readOnly: true, theme: '' });
  quill.setContents(JSON.parse(document.getElementById('content').textContent));
</script>"""

for slug, ts in SNAPSHOTS.items():
    post = json.loads((scratch / "ext" / f"{slug}.json").read_text())
    wayback = f"https://web.archive.org/web/{ts}/https://www.adservice.com/blog/article/{slug}"
    replace_img.dropped = 0
    if "customHTML" in post:
        body = re.sub(r'<img[^>]*\ssrc="([^"]+)"[^>]*>', replace_img, post["customHTML"])
        extra_head = extra_tail = ""
    else:
        ops = json.loads(post["content"])["ops"]
        # Images pasted from Google Docs (lh3.googleusercontent.com) have expired; drop them.
        kept = [op for op in ops if not (isinstance(op["insert"], dict) and "image" in op["insert"])]
        replace_img.dropped = len(ops) - len(kept)
        delta = json.dumps({"ops": kept}, ensure_ascii=False).replace("</", "<\\/")
        body = f'<script type="application/json" id="content">{delta}</script>\n  <div id="preview"></div>'
        extra_head = '<link rel="stylesheet" href="../assets/quill.snow.css">'
        extra_tail = QUILL_TAIL
    lost = " Some images from the original couldn't be recovered and are left out." if replace_img.dropped else ""
    danish = any(w in post["title"].lower() for w in ("vil du", "case", "tricks", "unikke"))
    page = PAGE.format(
        lang="da" if danish else "en",
        title=html.escape(post["title"]),
        category=html.escape(post["category"]),
        author=html.escape(post["author"]),
        date=post["timestamp"][:10],
        wayback=wayback,
        lost=lost,
        body=body,
        extra_head=extra_head,
        extra_tail=extra_tail,
    )
    (out / slug).mkdir(exist_ok=True)
    (out / slug / "index.html").write_text(page)
    left = re.findall(r'src="(https?://[^"]+)"', body)
    assert not any("stripocdn" in u or "newvideofrontiers" in u for u in left), left
    print(f"{slug}: {len(page)} bytes, dropped {replace_img.dropped} image(s)")
