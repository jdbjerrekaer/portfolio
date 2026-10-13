"""Rebuild the six Adservice blog posts as static pages.

Text: the post fields captured by the Wayback Machine (ext/*.json, see extract step).
Layout + images: the AdserviceCom repo (blog_article.html structure, app/static).
Usage: python3 -I build.py <scratch dir> <AdserviceCom/app/static> <out dir> <meta.json path>
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


# Body-only page: the site route app/writing/adservice/[slug] renders the header
# (back link, title, byline, archive note) and embeds this in an iframe, so the
# emails' global <style> blocks can't leak into the site.
PAGE = """<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{title}</title>
<base target="_blank">
{extra_head}
<style>
  html, body {{ margin: 0; background: transparent; }}
  body {{ font-family: Lato, Arial, sans-serif; color: #333; overflow: hidden; }}
  #preview .ql-editor {{ padding: 0; font-size: 16px; line-height: 1.6; }}
  img {{ max-width: 100%; }}
</style>
</head>
<body>
{body}
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

meta = {}
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
    danish = any(w in post["title"].lower() for w in ("vil du", "case", "tricks", "unikke"))
    page = PAGE.format(
        lang="da" if danish else "en",
        title=html.escape(post["title"]),
        body=body,
        extra_head=extra_head,
        extra_tail=extra_tail,
    )
    (out / slug).mkdir(exist_ok=True)
    (out / slug / "index.html").write_text(page)
    left = re.findall(r'src="(https?://[^"]+)"', body)
    assert not any("stripocdn" in u or "newvideofrontiers" in u for u in left), left
    meta[slug] = dict(title=post["title"], category=post["category"], author=post["author"],
                      date=post["timestamp"][:10], lang="da" if danish else "en",
                      wayback=wayback, imagesLost=replace_img.dropped > 0)
    print(f"{slug}: {len(page)} bytes, dropped {replace_img.dropped} image(s)")

(Path(sys.argv[4]) if len(sys.argv) > 4 else out / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
