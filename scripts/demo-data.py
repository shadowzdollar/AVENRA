#!/usr/bin/env python3
"""Fills a local Avenra with a demo account and realistic work, through the public API only.

Local development only: it reads the confirmation and request emails from the
local mail catcher (Mailpit) and never runs against anything but localhost.
Running it again signs in to the same account and adds nothing twice.

    make demo-data            # or: python3 scripts/demo-data.py
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

API = os.environ.get("AVENRA_API", "http://127.0.0.1:8080")
MAILPIT = os.environ.get("AVENRA_MAILPIT", "http://127.0.0.1:18025")
EMAIL = os.environ.get("DEMO_EMAIL", "demo@avenra.local")
PASSWORD = os.environ.get("DEMO_PASSWORD", "Avenra-Demo-2026")
NAME = "Dana Demo"
ORGANIZATION = "Northwind Advisors"

for url in (API, MAILPIT):
    if urllib.parse.urlparse(url).hostname not in ("127.0.0.1", "localhost"):
        sys.exit(f"Refusing to run against {url}: demo data is for local development only.")


class Session:
    """Cookies and the CSRF token, as a browser would keep them."""

    def __init__(self, extra_headers=None):
        self.cookies = {}
        self.extra = extra_headers or {}

    def call(self, method, path, body=None, headers=None, ok=(200, 201, 202, 204)):
        if method != "GET" and "XSRF-TOKEN" not in self.cookies:
            self.call("GET", "/api/v1/auth/csrf")
        request = urllib.request.Request(API + path, method=method)
        request.add_header("Accept", "application/json")
        for key, value in {**self.extra, **(headers or {})}.items():
            request.add_header(key, value)
        if self.cookies:
            request.add_header("Cookie", "; ".join(f"{k}={v}" for k, v in self.cookies.items()))
        if "XSRF-TOKEN" in self.cookies:
            request.add_header("X-XSRF-TOKEN", self.cookies["XSRF-TOKEN"])
        data = None
        if body is not None:
            data = json.dumps(body).encode()
            request.add_header("Content-Type", "application/json")
        try:
            response = urllib.request.urlopen(request, data, timeout=30)
            status, raw, cookies = response.status, response.read(), response.headers.get_all("Set-Cookie") or []
        except urllib.error.HTTPError as error:
            status, raw, cookies = error.code, error.read(), error.headers.get_all("Set-Cookie") or []
        for cookie in cookies:
            name, _, rest = cookie.partition("=")
            value = rest.split(";", 1)[0]
            if value and "max-age=0" not in cookie.lower():
                self.cookies[name] = value
            else:
                self.cookies.pop(name, None)  # cleared, e.g. the CSRF token after sign-in
        payload = json.loads(raw) if raw else None
        if status not in ok:
            raise RuntimeError(f"{method} {path} -> {status}: {payload}")
        return status, payload


def key():
    return {"Idempotency-Key": str(uuid.uuid4())}


def mail_link(to, pattern, newer_than=0.0):
    """The newest link matching the pattern in an email to this address."""
    for _ in range(60):
        query = urllib.parse.quote(f'to:"{to}"')
        with urllib.request.urlopen(f"{MAILPIT}/api/v1/search?query={query}", timeout=10) as response:
            messages = json.loads(response.read())["messages"]
        for summary in messages:
            created = datetime.fromisoformat(summary["Created"].replace("Z", "+00:00")).timestamp()
            if created < newer_than:
                continue
            with urllib.request.urlopen(f"{MAILPIT}/api/v1/message/{summary['ID']}", timeout=10) as response:
                text = json.loads(response.read())["Text"]
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        time.sleep(1)
    raise RuntimeError(f"No email to {to} matching {pattern} arrived in {MAILPIT}")


def account():
    me = Session()
    status, _ = me.call("POST", "/api/v1/auth/sign-in", {"email": EMAIL, "password": PASSWORD}, ok=(200, 400, 401, 403))
    if status == 200:
        return me
    started = time.time() - 5
    me.call("POST", "/api/v1/auth/sign-up", {"email": EMAIL, "password": PASSWORD, "displayName": NAME})
    token = mail_link(EMAIL, r"/verify-email\?token=([A-Za-z0-9_-]+)", started)
    me.call("POST", "/api/v1/auth/email-verification", {"token": token})
    me.call("POST", "/api/v1/auth/sign-in", {"email": EMAIL, "password": PASSWORD})
    return me


def main():
    me = account()
    _, memberships = me.call("GET", "/api/v1/organizations")
    if any(m["organization"]["name"] == ORGANIZATION for m in memberships):
        print(f"{ORGANIZATION} already exists; nothing added.")
        return report()
    _, organization = me.call("POST", "/api/v1/organizations", {"name": ORGANIZATION}, key())
    org = f"/api/v1/organizations/{organization['id']}"
    stamp = int(time.time())

    clients = {}
    for name in ("Globex Corporation", "Initech", "Umbrella Holdings"):
        address = f"{name.split()[0].lower()}-{stamp}@clients.avenra.local"
        _, client = me.call("POST", f"{org}/clients", {"name": name, "email": address}, key())
        clients[name] = (client["id"], address)

    def work(title, kind, client, days, description):
        due = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
        _, item = me.call(
            "POST",
            f"{org}/work",
            {"title": title, "type": kind, "clientId": clients[client][0], "dueAt": due, "description": description},
            key(),
        )
        return item["id"]

    def requirement(work_id, title, kind):
        _, item = me.call("POST", f"{org}/work/{work_id}/requirements", {"title": title, "kind": kind, "required": True}, key())
        return item["id"]

    def move(work_id, *steps):
        for current, target, *reason in steps:
            body = {"expectedStatus": current, "to": target}
            if reason:
                body["reason"] = reason[0]
            me.call("POST", f"{org}/work/{work_id}/transitions", body)

    def request(work_id, client, requirement_ids):
        started = time.time() - 5
        me.call(
            "POST",
            f"{org}/work/{work_id}/request-links",
            {"recipientEmail": clients[client][1], "requirementIds": requirement_ids, "message": "Thank you for sending these this week."},
            key(),
        )
        return mail_link(clients[client][1], r"/request#([A-Za-z0-9_-]+)", started)

    # 1. Onboarding in progress: asked the client, who answered one item.
    onboarding = work("Onboard Globex Corporation", "Client onboarding", "Globex Corporation", 9,
                      "Collect and verify everything required from Globex before the engagement starts.")
    legal = requirement(onboarding, "Registered legal name", "TEXT")
    certificate = requirement(onboarding, "Certificate of incorporation", "DOCUMENT")
    tax = requirement(onboarding, "Tax identification number", "TEXT")
    move(onboarding, ("DRAFT", "READY"), ("READY", "RUNNING"))
    token = request(onboarding, "Globex Corporation", [legal, certificate, tax])
    client = Session({"X-Avenra-Request-Token": token})
    client.call("POST", f"/api/v1/client-requests/current/requirements/{legal}/value", {"value": "Globex Corporation Ltd"})

    # 2. Audit evidence: asked, nothing back yet.
    audit = work("Annual audit evidence pack", "Compliance evidence", "Initech", 4,
                 "Assemble the evidence the auditors asked for.")
    access = requirement(audit, "Access review export (Q3)", "DOCUMENT")
    policy = requirement(audit, "Signed security policy", "DOCUMENT")
    move(audit, ("DRAFT", "READY"), ("READY", "RUNNING"))
    request(audit, "Initech", [access, policy])

    # 3. A completed report, accepted and sealed with its evidence.
    report_id = work("Q3 board report", "Recurring reporting", "Umbrella Holdings", -2, "Quarterly figures for the board.")
    revenue = requirement(report_id, "Q3 revenue figure", "NUMBER")
    move(report_id, ("DRAFT", "READY"), ("READY", "RUNNING"))
    _, item = me.call("POST", f"{org}/work/{report_id}/requirements/{revenue}/value", {"value": "1284500"}, key())
    me.call("POST", f"{org}/work/{report_id}/requirements/{revenue}/review", {"itemId": item["id"], "decision": "ACCEPT"})
    move(report_id, ("RUNNING", "COMPLETED"))

    # 4. Blocked work, with the reason recorded.
    kyc = work("KYC refresh", "Client onboarding", "Initech", 12, "Refresh identity checks for the directors.")
    requirement(kyc, "Director passport copies", "DOCUMENT")
    move(kyc, ("DRAFT", "READY"), ("READY", "RUNNING"), ("RUNNING", "BLOCKED", "Waiting for the client's new director to be appointed."))

    # 5. Defined, not started.
    work("Engagement letter renewal", "Document collection", "Globex Corporation", 21, "Renew the engagement letter for 2027.")

    # A colleague invited, not yet joined.
    me.call("POST", f"{org}/invitations", {"email": f"colleague-{stamp}@avenra.local", "role": "MANAGER"}, key())
    return report()


def report():
    print()
    print("Demo ready. Open http://localhost:3000/sign-in")
    print(f"  Email:    {EMAIL}")
    print(f"  Password: {PASSWORD}")
    print(f"  Emails to clients and colleagues: {MAILPIT}")


if __name__ == "__main__":
    main()
