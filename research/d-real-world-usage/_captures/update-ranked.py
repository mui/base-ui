#!/usr/bin/env python3
"""Update ranked.json (and candidates.json) screenshot fields based on manifest-a.json,
and produce the final manifest-a.json in the required schema.

Run after capture.mjs has written _captures/manifest-a.json (raw per-site capture log).
"""
import json
import os
from urllib.parse import urlparse

BASE = "/Users/yannbraga/open-source/base-ui/research/d-real-world-usage"
CAPTURES = os.path.join(BASE, "_captures")

def domain_of(url):
    d = urlparse(url).netloc.lower()
    if d.startswith("www."):
        d = d[4:]
    return d

with open(os.path.join(CAPTURES, "manifest-a-raw.json")) as f:
    raw = json.load(f)

# Build domain -> capture result map
by_domain = {r["domain"]: r for r in raw}

components = ["select", "dialog", "menu", "popover"]

final_manifest = []

for comp in components:
    for fname in ["ranked.json", "candidates.json"]:
        path = os.path.join(BASE, comp, fname)
        if not os.path.exists(path):
            continue
        with open(path) as f:
            data = json.load(f)
        changed = False
        for entry in data:
            live_url = entry.get("liveUrl")
            if not live_url or live_url == "null":
                continue
            dom = domain_of(live_url)
            cap = by_domain.get(dom)
            if not cap:
                continue
            if cap["status"] == "captured":
                screenshot = {
                    "status": "captured",
                    "path": f"../_captures/{cap['file']}",
                    "attempts": cap["attempts"],
                }
                if cap.get("fileOpen"):
                    screenshot["pathOpen"] = f"../_captures/{cap['fileOpen']}"
            else:
                screenshot = {
                    "status": "skipped",
                    "attempts": cap["attempts"],
                }
            entry["screenshot"] = screenshot
            changed = True
        if changed:
            with open(path, "w") as f:
                json.dump(data, f, indent=2)
                f.write("\n")
            print(f"Updated {path}")

# Build manifest-a.json in the required top-level schema (one row per distinct site captured)
for site in raw:
    comps_for_site = site["components"]
    final_manifest.append({
        "url": site["url"],
        "domain": site["domain"],
        "componentsEvidenced": comps_for_site,
        "file": f"_captures/{site['file']}" if site.get("file") else None,
        "fileOpen": f"_captures/{site['fileOpen']}" if site.get("fileOpen") else None,
        "status": site["status"],
        "attempts": site["attempts"],
        "bytes": site.get("bytes"),
        "bytesOpen": site.get("bytesOpen"),
    })

with open(os.path.join(BASE, "_captures", "manifest-a.json"), "w") as f:
    json.dump(final_manifest, f, indent=2)
    f.write("\n")

print(f"\nWrote {os.path.join(BASE, '_captures', 'manifest-a.json')}")
print(f"Captured: {sum(1 for s in raw if s['status']=='captured')}")
print(f"Skipped: {sum(1 for s in raw if s['status']!='captured')}")
