#!/usr/bin/env python3
"""Weekly DMARC readout for hawthorneducation.com, run by the weekly DMARC routine.

Copied from jon-hanover/onwisdom scripts/dmarc-weekly.py (14 Oct 2026) with
DOMAIN changed. docs/routines.md is the home for what the routine does with
the result. This file only turns receivers' aggregate-report emails (Google,
Mimecast and others) into the
week-versus-baseline table the routine reads.

Input is the RAW form of each report email as the Gmail connector returns it
(base64url of the full MIME message, zip or gz attachment inline). Two ways to
supply it:

  python3 scripts/dmarc-weekly.py DIR
      every DIR/*.b64 file holds one message's raw field

  python3 scripts/dmarc-weekly.py --transcript PATH ID [ID ...]
      pulls the raw field for each Gmail message id out of a Claude Code
      session transcript (.jsonl), because get_message RAW is the only way the
      connector hands over an attachment and its output is too large to retype

Output: one table per window (this week = report end within the last 8 days,
baseline = older, up to 90 days), one row per source IP with total messages,
aligned messages, how many reports it appeared in, and the distinct
authentication signatures seen. Alignment is DMARC's own verdict: the report's
policy_evaluated dkim or spf says pass.
"""
import base64
import collections
import datetime
import email
import glob
import gzip
import io
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

DOMAIN = "hawthorneducation.com"


def parse_raw(raw):
    """One Gmail RAW string -> list of report dicts (normally exactly one)."""
    mime = base64.urlsafe_b64decode(raw.strip() + "=" * (-len(raw.strip()) % 4))
    msg = email.message_from_bytes(mime)
    out = []
    for part in msg.walk():
        fn = part.get_filename() or ""
        data = part.get_payload(decode=True)
        if not data:
            continue
        if fn.endswith(".zip"):
            z = zipfile.ZipFile(io.BytesIO(data))
            xmlb = z.read(z.namelist()[0])
        elif fn.endswith(".gz"):
            xmlb = gzip.decompress(data)
        else:
            continue
        root = ET.fromstring(xmlb)
        meta = root.find("report_metadata")
        pol = root.find("policy_published")
        rep = {
            "org": meta.findtext("org_name"),
            "report_id": meta.findtext("report_id"),
            "begin": int(meta.find("date_range").findtext("begin")),
            "end": int(meta.find("date_range").findtext("end")),
            "domain": pol.findtext("domain"),
            "p": pol.findtext("p"),
            "records": [],
        }
        for rec in root.findall("record"):
            row = rec.find("row")
            pe = row.find("policy_evaluated")  # child of row, not record
            ids = rec.find("identifiers")
            ar = rec.find("auth_results")
            dk = ar.find("dkim") if ar is not None else None
            sp = ar.find("spf") if ar is not None else None
            rep["records"].append({
                "ip": row.findtext("source_ip"),
                "count": int(row.findtext("count") or 0),
                "disposition": pe.findtext("disposition") if pe is not None else None,
                "dkim_aligned": (pe.findtext("dkim") if pe is not None else None) == "pass",
                "spf_aligned": (pe.findtext("spf") if pe is not None else None) == "pass",
                "header_from": ids.findtext("header_from") if ids is not None else None,
                "dkim_domain": dk.findtext("domain") if dk is not None else None,
                "dkim_result": dk.findtext("result") if dk is not None else None,
                "spf_domain": sp.findtext("domain") if sp is not None else None,
                "spf_result": sp.findtext("result") if sp is not None else None,
            })
        out.append(rep)
    return out


def raws_from_dir(d):
    for p in sorted(glob.glob(os.path.join(d, "*.b64"))):
        yield os.path.basename(p), open(p).read()


def raws_from_transcript(path, ids):
    data = open(path, encoding="utf-8", errors="replace").read()
    for mid in ids:
        m = re.search(re.escape(mid) + r'.{0,200}?raw\\*":\\*"([A-Za-z0-9_\-]{2000,})', data, re.S)
        if not m:
            print(f"!! no RAW payload for {mid} in transcript", file=sys.stderr)
            continue
        yield mid, m.group(1)


def aggregate(reports):
    by_ip = collections.defaultdict(lambda: {"count": 0, "aligned": 0, "reports": 0, "auth": set()})
    for rep in reports:
        seen = set()
        for r in rep["records"]:
            a = by_ip[r["ip"]]
            a["count"] += r["count"]
            if r["dkim_aligned"] or r["spf_aligned"]:
                a["aligned"] += r["count"]
            a["auth"].add(
                f"dkim {r['dkim_domain']}:{r['dkim_result']} / spf {r['spf_domain']}:{r['spf_result']}"
                f" / from {r['header_from']} / disposition {r['disposition']}")
            seen.add(r["ip"])
        for ip in seen:
            by_ip[ip]["reports"] += 1
    return by_ip


def main(argv):
    if len(argv) >= 3 and argv[0] == "--transcript":
        source = list(raws_from_transcript(argv[1], argv[2:]))
    elif len(argv) == 1 and os.path.isdir(argv[0]):
        source = list(raws_from_dir(argv[0]))
    else:
        print(__doc__)
        return 2

    reports = []
    for label, raw in source:
        try:
            for rep in parse_raw(raw):
                rep["source"] = label
                if rep["domain"] != DOMAIN:
                    print(f"-- skipping {label}: policy_published domain is {rep['domain']}")
                    continue
                reports.append(rep)
        except Exception as e:  # one bad attachment must not hide the others
            print(f"!! {label}: {e}", file=sys.stderr)

    now = datetime.datetime.now(datetime.timezone.utc)
    cutoff = now - datetime.timedelta(days=8)
    floor = now - datetime.timedelta(days=90)
    week, baseline = [], []
    for rep in reports:
        end = datetime.datetime.fromtimestamp(rep["end"], datetime.timezone.utc)
        if end >= cutoff:
            week.append(rep)
        elif end >= floor:
            baseline.append(rep)

    for title, rs in (("THIS WEEK (report end within 8 days)", week),
                      ("BASELINE (8 to 90 days)", baseline)):
        print(f"\n== {title}: {len(rs)} report(s) ==")
        for rep in sorted(rs, key=lambda r: r["begin"]):
            day = datetime.datetime.fromtimestamp(rep["begin"], datetime.timezone.utc).date()
            print(f"  {day} {rep['org']} p={rep['p']} records={len(rep['records'])} ({rep['source']})")
        for ip, a in sorted(aggregate(rs).items(), key=lambda kv: -kv[1]["count"]):
            print(f"  {ip:>16}  msgs={a['count']:<4} aligned={a['aligned']:<4} reports={a['reports']}")
            for sig in sorted(a["auth"]):
                print(f"{'':>20}{sig}")

    week_ips = set(aggregate(week))
    base_ips = set(aggregate(baseline))
    new_ips = week_ips - base_ips
    print("\n== NEW SOURCE IPs THIS WEEK (absent from baseline) ==")
    print("  " + (", ".join(sorted(new_ips)) if new_ips else "none"))
    if not baseline:
        # Until reports older than 8 days exist (the record went live 13 Oct
        # 2026), every IP lands here; judge them against the expected list.
        print("  (baseline is empty, so every IP this week shows as new)")
    json.dump({"week": week, "baseline": baseline}, open("dmarc-reports.json", "w"), indent=1, default=str)
    print("\nfull parse written to dmarc-reports.json")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
