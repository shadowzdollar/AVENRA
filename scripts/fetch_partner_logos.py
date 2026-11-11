#!/usr/bin/env python3
import json
import subprocess
import os
import sys
import urllib.parse

DEST_DIR = "/home/ghost/Projects/AVENRA/apps/web/public/logos"
os.makedirs(DEST_DIR, exist_ok=True)

PARTNERS = {
    "microsoft365": ["Microsoft 365 (2022).svg", "Microsoft 365 logo filetype:svg"],
    "sharepoint": ["Microsoft Office SharePoint (2019–present).svg", "SharePoint logo filetype:svg"],
    "onedrive": ["Microsoft Office OneDrive (2019–present).svg", "Microsoft OneDrive logo filetype:svg"],
    "box": ["Box, Inc. logo.svg", "Box logo filetype:svg"],
    "aws": ["Amazon Web Services Logo.svg", "Amazon Web Services logo filetype:svg"],
    "cloudflare": ["Cloudflare Logo.svg", "Cloudflare logo filetype:svg"],
    "wasabi": ["Wasabi Technologies logo.svg", "Wasabi logo filetype:svg"],
    "google-workspace": ["Google Workspace Logo.svg", "Google Workspace logo filetype:svg"],
    "wolters-kluwer": ["Wolters Kluwer logo.svg", "Wolters Kluwer logo filetype:svg"],
    "xero": ["Xero software logo.svg", "Xero logo filetype:svg"],
    "salesforce": ["Salesforce.com logo.svg", "Salesforce logo filetype:svg"],
    "hubspot": ["HubSpot Logo.svg", "HubSpot logo filetype:svg"],
    "okta": ["Okta logo.svg", "Okta logo filetype:svg"],
    "entra": ["Microsoft Entra ID icon.svg", "Microsoft Entra logo filetype:svg"],
    "openai": ["OpenAI Logo.svg", "OpenAI logo filetype:svg"],
    "stripe": ["Stripe Logo, revised 2016.svg", "Stripe logo filetype:svg"],
    "twilio": ["Twilio-logo-red.svg", "Twilio logo filetype:svg"],
    "sendgrid": ["SendGrid logo.svg", "SendGrid logo filetype:svg"],
    "zapier": ["Zapier logo.svg", "Zapier logo filetype:svg"],
    "digitalocean": ["DigitalOcean logo.svg", "DigitalOcean logo filetype:svg"],
    "clio": ["Clio logo.svg", "Clio cloud legal filetype:svg", "Clio logo"],
    "drata": ["Drata logo filetype:svg", "Drata security logo"],
    "vanta": ["Vanta logo filetype:svg", "Vanta security logo"],
    "imanage": ["iManage logo filetype:svg", "iManage legal logo"],
    "netdocuments": ["NetDocuments logo filetype:svg", "NetDocuments logo"],
    "karbon": ["Karbon logo filetype:svg", "Karbon practice management logo"],
    "smokeball": ["Smokeball logo filetype:svg", "Smokeball legal logo"],
    "anthropic": ["Anthropic logo.svg", "Anthropic AI logo filetype:svg"],
    "make": ["Make logo filetype:svg", "Integromat Make logo"],
    "n8n": ["n8n logo filetype:svg", "n8n automation logo"],
    "minio": ["MinIO logo.svg", "MinIO logo filetype:svg"],
    "backblaze": ["Backblaze logo.svg", "Backblaze logo filetype:svg"],
}

def get_wikimedia_url_by_title(title):
    quoted = urllib.parse.quote(title)
    cmd = [
        "curl", "-4", "-s",
        f"https://en.wikipedia.org/w/api.php?action=query&titles=File:{quoted}&prop=imageinfo&iiprop=url&format=json",
        "-H", "User-Agent: AvenraPartnerLogoFetcher/1.0 (contact@avenra.com)"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        data = json.loads(res.stdout)
        pages = data.get("query", {}).get("pages", {})
        for _, page in pages.items():
            if "imageinfo" in page and len(page["imageinfo"]) > 0:
                return page["imageinfo"][0]["url"]
    except Exception as e:
        pass
    return None

def search_wikimedia(query):
    quoted = urllib.parse.quote(query)
    cmd = [
        "curl", "-4", "-s",
        f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch={quoted}&gsrlimit=3&prop=imageinfo&iiprop=url&format=json",
        "-H", "User-Agent: AvenraPartnerLogoFetcher/1.0 (contact@avenra.com)"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        data = json.loads(res.stdout)
        pages = data.get("query", {}).get("pages", {})
        for _, page in pages.items():
            if "imageinfo" in page and len(page["imageinfo"]) > 0:
                return page["imageinfo"][0]["url"]
    except Exception as e:
        pass
    return None

print("Starting logo fetch...")
for partner, queries in PARTNERS.items():
    dest_svg = os.path.join(DEST_DIR, f"{partner}.svg")
    dest_png = os.path.join(DEST_DIR, f"{partner}.png")
    if os.path.exists(dest_svg) and os.path.getsize(dest_svg) > 200:
        print(f"[{partner}] Already exists: {dest_svg}")
        continue

    url = None
    # 1. Try exact title
    first_title = queries[0]
    if first_title.endswith(".svg") or first_title.endswith(".png"):
        url = get_wikimedia_url_by_title(first_title)

    # 2. Try search queries
    if not url:
        for q in queries:
            url = search_wikimedia(q)
            if url:
                break

    if url:
        # Download
        is_png = ".png" in url.lower()
        target = dest_png if is_png else dest_svg
        download_cmd = ["curl", "-4", "-sL", url, "-o", target, "-H", "User-Agent: AvenraPartnerLogoFetcher/1.0 (contact@avenra.com)"]
        subprocess.run(download_cmd)
        if os.path.exists(target) and os.path.getsize(target) > 100:
            print(f"[{partner}] Successfully downloaded -> {target} ({os.path.getsize(target)} bytes)")
        else:
            print(f"[{partner}] Failed to download from {url}")
    else:
        print(f"[{partner}] Not found in Wikimedia: queries={queries}")
