# Routines

The scheduled jobs that run against this repo, who runs them, and how to
change them. Created 14 October 2026.

**This file is the routine's instructions.** The routine session reads the
section below at the start of every run and follows it as written, and the
trigger prompt only says "run now". To change what the routine does, edit
this file and merge it to `main`. No second copy exists to keep in step.
The one exception is the trigger prompt itself (its first step, making sure
the repo is cloned, has to work before this file can be read). If you
change that prompt, update the copy under *Trigger prompt* below too.

## Weekly: DMARC readout for hawthorneducation.com

| | |
| :-- | :-- |
| Routine | `Hawthorn weekly DMARC readout`, trigger `trig_019c7zs8pxiMsypCuxkux8CZ` |
| Session | `session_016WPbTiJGj44USsuiJEhFWV` (persistent, Sonnet 5.5, Jon's choice 14 Oct 2026) |
| Schedule | Mondays 6:52 AM Denver (`CRON_TZ=America/Denver 52 6 * * 1`) |
| Sends to | jon@hawthorneducation.com, every week, quiet or not |
| Parser | [`scripts/dmarc-weekly.py`](../scripts/dmarc-weekly.py) |

Modelled on the DMARC check inside onWisdom's weekly hygiene pass
(`jon-hanover/onwisdom`, `docs/routines.md`, *Mail authentication*). The
parser is a copy of that repo's script with `DOMAIN` changed.

### Background

The live record (checked 14 Oct 2026, the day after it was published):

```
_dmarc.hawthorneducation.com  TXT  "v=DMARC1; p=none; rua=mailto:jon@hawthorneducation.com; fo=1"
```

SPF is `v=spf1 include:_spf.google.com ~all`, DKIM is published at
`google._domainkey`, and MX is Google. The website is on GitHub Pages and
sends no mail.

Google sends one aggregate report a day from
`noreply-dmarc-support@google.com` to the `rua=` address, subject
`Report domain: hawthorneducation.com Submitter: google.com Report-ID: ...`,
with a zipped XML attachment. The first one covered 13 Oct 2026. The same
inbox also receives onWisdom's reports (`Report domain: onwisdom.org`).
onWisdom's own routine handles those, so this one ignores them; the parser
skips any report for another domain anyway.

The policy is `p=none`, so receivers deliver everything regardless. A flag
in this report means "take a look". It never means mail was blocked.

### Expected senders

Never flagged:

- **Google Workspace** (Jon's own Gmail). Shows up as Google outbound IPs,
  usually `209.85.220.x`, with DKIM `hawthorneducation.com:pass` or SPF
  `hawthorneducation.com:pass`. Any row whose DKIM passes for
  `hawthorneducation.com` was signed with our key, and only Workspace holds
  that key, so it is ours whatever the IP.
- **Low-volume forwarding and reply-relay mismatches** from known platforms:
  a few messages where the header From is hawthorneducation.com but SPF or
  DKIM belongs to a mailing list, a forwarder, or a calendar or newsletter
  service relaying a reply. These are normal side effects of mail being
  forwarded, not someone spoofing the domain.

Jon confirmed on 14 Oct 2026 that nothing else sends as hawthorneducation.com.
When a new service starts sending (a newsletter tool, a CRM, a scheduling
tool), add it to this list in the same change that sets it up.

### What to flag

Only these go under **Worth a look**:

1. A source IP that is absent from the baseline and carries more than a
   handful of messages (more than 5 in the week) and is not an expected
   sender.
2. An unexplained source that persists or grows week over week.
3. Any record whose From is hawthorneducation.com with both DKIM and SPF
   failing, at volume (more than 5 messages).
4. The `_dmarc` record is gone, or its `rua=` no longer points at
   jon@hawthorneducation.com.

Everything else is green. Say green when it is green. A report that dresses
up normal operation as a finding teaches Jon to stop reading it.

Until reports older than 8 days exist (from about 22 Oct 2026), the
baseline is empty and the parser lists every IP as new. In those weeks,
judge each IP against the expected senders list and not the "new" list.

### Run steps

1. **Repo.** The trigger prompt has already made sure `/home/user/hawthorn`
   exists and is on the latest `main`. Run every command below from the
   repo root.
2. **Connector check.** If this session has no Gmail connector tools
   (`search_threads`, `get_message`, `send_message`), stop and say which is
   missing, so Jon can turn it on in this session's connector settings.
   Never fall back to Zapier for any step.
3. **DNS.** Look up the live record:
   `curl -sS "https://dns.google/resolve?name=_dmarc.hawthorneducation.com&type=TXT"`.
   Note the policy and `rua=` for the email.
4. **Find this week's reports.** Gmail `search_threads`:
   `from:noreply-dmarc-support@google.com subject:"Report domain: hawthorneducation.com" newer_than:8d in:anywhere`
   (page size 50).
5. **Find the baseline.** Same search with `older_than:8d newer_than:90d`
   in place of `newer_than:8d`. Page through all results.
6. **Fetch.** `get_message` with `messageFormat: RAW` for every message id
   from steps 4 and 5. Do not try to read or retype the payloads.
7. **Parse.** The RAW payloads are now in this session's transcript. Find
   it and run the parser from a scratch directory:
   ```sh
   T=$(grep -l FIRST_MESSAGE_ID ~/.claude/projects/*/*.jsonl | xargs ls -t | head -1)
   python3 -I /home/user/hawthorn/scripts/dmarc-weekly.py --transcript "$T" ID1 ID2 ...
   ```
   If it prints `!! no RAW payload for <id>`, fetch that message again and
   rerun. A container restart mid-run can split the transcript into two
   files.
8. **Judge** each row against *Expected senders* and *What to flag*.
9. **No reports this week?** Then the email says so plainly and names the
   records that might still be pending: `rua=` on
   `_dmarc.hawthorneducation.com`. Because `rua=` points at the same domain,
   no external authorisation record is needed today. If `rua=` is ever moved
   to another domain, that domain must publish
   `hawthorneducation.com._report._dmarc.<that domain>` with
   `v=DMARC1`, so name that record too.
10. **Send the email** (below) with the native Gmail connector's
    `send_message`. If that send fails, say so in the session and stop.
    Never use Zapier.
11. **Print** the email's text in the session as well, so the run is
    readable from the session itself.

### The email

- To `jon@hawthorneducation.com`. Subject:
  `Hawthorn DMARC weekly: all clear (week ending Mon D)`, or
  `... : worth a look (...)`, or `... : no reports (...)`.
- HTML with a plain-text alternative: headings, bullets, bold, IPs in
  monospace. Single column, Arial or Helvetica 14px, no images. No greeting
  and no sign-off, since Jon is emailing himself.
- Goes out every week, even when everything is quiet, so Jon knows it ran.
- No em-dashes and no negative parallelism ("It's not X. It's Y.").

Order:

1. **Verdict**, one line: "All clear: every message sent as
   hawthorneducation.com this week came from Google Workspace and passed."
   (or the flag count, or "No reports arrived this week").
2. **This week**: number of reports received (out of about 7), total
   messages, how many aligned, then one bullet per source IP with its
   message count, aligned count, and what it is (for example, "Google
   Workspace").
3. **Worth a look**: only when something meets the bar in *What to flag*.
   For each item say what was seen, why it crossed the bar, and the likely
   next step. Leave the heading out entirely when nothing qualifies.
4. **FYI**, short: the live policy and `rua=`, whether the baseline is
   still building, and anything else that is expected but worth knowing.
   Drop an FYI that has not changed in weeks.

### Trigger prompt

The Routine sends this every Monday. Keep it short; the steps above are the
substance.

```
Scheduled run: Hawthorn weekly DMARC readout. Unattended, so never ask questions. Skip the Google Drive guidebook: docs/routines.md is self-contained.

FIRST, make the repo exist. If /home/user/hawthorn is absent, attach jon-hanover/hawthorn with add_repo (read access), clone it to /home/user/hawthorn with a generous timeout (about 10 minutes), then call register_repo_root. Then run: git -C /home/user/hawthorn fetch origin && git -C /home/user/hawthorn checkout --detach origin/main. If scripts/dmarc-weekly.py is not on main yet, check out origin/claude/dmarc-weekly instead. Never run this from memory when the repo is missing.

THEN read the section "Weekly: DMARC readout for hawthorneducation.com" in /home/user/hawthorn/docs/routines.md in full and follow its run steps exactly. It ends with one HTML email to jon@hawthorneducation.com, sent every week even when all is clear, through the native Gmail connector. Never use Zapier. If the Gmail connector tools are missing from this session, say which and stop.
```

### Failure modes worth knowing

- **Connector access belongs to the session.** Jon grants Gmail in the
  routine session's connector settings. A run without it says what is
  missing and stops instead of half-running.
- **A session without the repo runs blind.** The routine session's
  container can be recycled, leaving an empty working directory. The trigger
  prompt clones the repo first for that reason.
- **The routine cannot see its own failures.** `list_triggers` shows each
  Routine's last run. A Monday with no email means check there.
- **Prompt edits.** `update_trigger` can only change the prompt of a Routine
  from the session it fires into, or from the claude.ai Routines UI. The
  name, schedule and enabled state are editable from anywhere.
