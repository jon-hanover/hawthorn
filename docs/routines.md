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
| Emails | Jon's Hawthorn address (named in the stored trigger prompt), only when something needs a look (Jon, 14 Oct 2026). Quiet weeks send nothing. |
| Parser | [`scripts/dmarc-weekly.py`](../scripts/dmarc-weekly.py) |

**At a glance**

- Receivers email DMARC aggregate reports for hawthorneducation.com to
  Jon's Hawthorn inbox: Google once a day, and others (Mimecast from
  16 Oct 2026) whenever Jon has mailed one of their customers. A Gmail
  filter (Jon set it up on 14 Oct 2026, widened 16 Oct 2026 to match any
  reporter) files each one under the **Hawthorn DMARC** label, marked read
  and out of the inbox.
- Every Monday morning a claude.ai Routine wakes the routine session. It
  pulls the week's reports and the 90-day baseline with the Gmail
  connector, runs `scripts/dmarc-weekly.py`, and checks the live `_dmarc`
  record.
- A green week sends nothing; the readout is written in the routine
  session. A week with a problem sends one email to
  Jon's Hawthorn inbox. Jon's rule (14 Oct 2026): no DMARC mail in
  the inbox, Google's or Claude's, unless something needs a look.
- Proven on 14 Oct 2026: a run under these rules found one report with two
  messages from Google Workspace, both aligned, and sent nothing.
- To change what the routine does, edit this section and merge to `main`.
  To see past runs, open the routine session or the claude.ai Routines
  page.

Modelled on the DMARC check inside onWisdom's weekly hygiene pass
(`jon-hanover/onwisdom`, `docs/routines.md`, *Mail authentication*). The
parser is a copy of that repo's script with `DOMAIN` changed.

### Background

The live record (checked 14 Oct 2026, the day after it was published):

```
_dmarc.hawthorneducation.com  TXT  "v=DMARC1; p=none; rua=mailto:<Jon's Hawthorn address>; fo=1"
```

SPF is `v=spf1 include:_spf.google.com ~all`, DKIM is published at
`google._domainkey`, and MX is Google. The website is on GitHub Pages and
sends no mail.

Google sends one aggregate report a day from
`noreply-dmarc-support@google.com` to the `rua=` address, subject
`Report domain: hawthorneducation.com Submitter: google.com Report-ID: ...`,
with a zipped XML attachment. The first one covered 13 Oct 2026.

Other receivers report too, on their own schedule and only for days when
they received mail from hawthorneducation.com. The first was Mimecast on
16 Oct 2026: sender `no-reply@us-1.mimecastreport.com`, subject
`Report domain: hawthorneducation.com Submitter: mimecast.org Report-ID: ...`,
gzipped XML attachment named `mimecast.org!hawthorneducation.com!<begin>!<end>.gz`.
Microsoft, Yahoo and others may follow. They all use the same subject
format, so the routine matches on subject alone, and the parser reads zip
and gz alike. Their counts cover only mail Jon sent to that receiver's
customers, so they are small and irregular. The same
inbox also receives onWisdom's reports (`Report domain: onwisdom.org`).
onWisdom's own routine handles those, so this one ignores them; the parser
skips any report for another domain anyway.

Jon wants no DMARC mail in his inbox unless something is wrong, so a Gmail
filter (Jon created it by hand on 14 Oct 2026, since the Gmail connector
cannot create filters) sends every reporter's reports straight to the
**Hawthorn DMARC** label, skipping the inbox and marked read, the same way
**onWisdom DMARC** already works. On 16 Oct 2026 Jon dropped the From
criterion so Mimecast's and later reporters' mail is caught too:

- Subject: `Report domain: hawthorneducation.com` (no From criterion)
- Actions: Skip the Inbox, Mark as read, Apply the label "Hawthorn DMARC"

The routine searches `in:anywhere`, so it still finds archived reports.

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
  service relaying a reply. These are normal side effects of forwarded
  mail.

Jon confirmed on 14 Oct 2026 that nothing else sends as hawthorneducation.com.
When a new service starts sending (a newsletter tool, a CRM, a scheduling
tool), add it to this list in the same change that sets it up.

### What counts as a problem

Only a problem sends an email. These are the problems:

1. A source IP that is absent from the baseline and carries more than a
   handful of messages (more than 5 in the week) and is not an expected
   sender.
2. An unexplained source that persists or grows week over week.
3. Any record whose From is hawthorneducation.com with both DKIM and SPF
   failing, at volume (more than 5 messages).
4. The `_dmarc` record is gone, or its `rua=` no longer points at
   Jon's Hawthorn address (the one the trigger prompt emails).
5. No report arrived all week.
6. The readout itself could not finish (a fetch or the parser kept
   failing) while Gmail was still reachable.

Everything else is green, and green sends nothing. A report that dresses up
normal operation as a finding teaches Jon to stop reading it.

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
   Note the policy and `rua=`.
4. **Find this week's reports.** Gmail `search_threads`:
   `subject:"Report domain: hawthorneducation.com" newer_than:8d in:anywhere`
   (page size 50). No `from:` term, so every reporter is included (Google,
   Mimecast, and any others). If a hit has no zip or gz attachment, or its
   sender is not a recognisable reporting service, leave it out of the
   parse and mention it in the readout.
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
8. **Judge** each row against *Expected senders* and *What counts as a
   problem*.
9. **Write the readout in the session every week**, in the shape described
   under *The email*, so each run leaves a record whether or not it sends.
10. **Email only if there is a problem.** If nothing in *What counts as a
    problem* applies, send nothing and end the run. Otherwise send the
    email below with the native Gmail connector's `send_message`. If that
    send fails, say so in the session and stop. Never use Zapier.

### The email

Sent only when there is a problem.

- To Jon's Hawthorn address, the one named in the trigger prompt. Subject:
  `Hawthorn DMARC: worth a look (week ending Mon D)`, or
  `Hawthorn DMARC: no reports this week (week ending Mon D)`, or
  `Hawthorn DMARC: readout could not run (Mon D)`.
- HTML with a plain-text alternative: headings, bullets, bold, IPs in
  monospace. Single column, Arial or Helvetica 14px, no images. No greeting
  and no sign-off, since Jon is emailing himself.
- No em-dashes and no negative parallelism ("It's not X. It's Y.").
- The policy is `p=none`, so say "take a look", never that mail was
  blocked.

Order:

1. **What needs a look**, one line per problem.
2. **Details**: for each problem, what was seen (IP, message counts, the
   DKIM/SPF/From signature), why it crossed the bar, and the likely next
   step.
   - **No reports:** name the records that might still be pending, which is
     `rua=` on `_dmarc.hawthorneducation.com`. Because `rua=` points at the
     same domain, no external authorisation record is needed today. If
     `rua=` is ever moved to another domain, that domain must publish
     `hawthorneducation.com._report._dmarc.<that domain>` with `v=DMARC1`,
     so name that record too.
   - **Readout could not run:** say which step failed and the error.
3. **The rest of the week**, briefly: reports received by reporter
   (Google sends about 7; others vary),
   total messages, how many aligned, and one bullet per source IP with
   what it is, so the problem has context.
4. **FYI**: the live policy and `rua=`, and whether the baseline is still
   building.

### Trigger prompt

The Routine sends this every Monday. Keep it short; the steps above are the
substance. The stored prompt names Jon's Hawthorn address where this copy
shows `<Jon's Hawthorn address>`, so the address stays out of this public
repo.

```
Scheduled run: Hawthorn weekly DMARC readout. Unattended, so never ask questions. Skip the Google Drive guidebook: docs/routines.md is self-contained.

FIRST, make the repo exist. If /home/user/hawthorn is absent, attach jon-hanover/hawthorn with add_repo (read access), clone it to /home/user/hawthorn with a generous timeout (about 10 minutes), then call register_repo_root. Then run: git -C /home/user/hawthorn fetch origin && git -C /home/user/hawthorn checkout --detach origin/main. Never run this from memory when the repo is missing.

THEN read the section "Weekly: DMARC readout for hawthorneducation.com" in /home/user/hawthorn/docs/routines.md in full and follow its run steps exactly. Write the readout in this session every week. Email <Jon's Hawthorn address> only when there is a problem, through the native Gmail connector; a green week sends nothing. Never use Zapier. If the Gmail connector tools are missing from this session, say which and stop.
```

### Failure modes worth knowing

- **Silence is the normal case, so a broken routine is silent too.** Each
  run writes its readout in the routine session, and `list_triggers` shows
  each Routine's last run. If something seems off, look there.
- **Connector access belongs to the session.** Jon grants Gmail in the
  routine session's connector settings. A run without it says what is
  missing in the session and stops, and it cannot email about it.
- **A session without the repo runs blind.** The routine session's
  container can be recycled, leaving an empty working directory. The trigger
  prompt clones the repo first for that reason.
- **"Run now" spawns a different session.** Firing the Routine by hand
  (`fire_trigger`, or Run now in the Routines UI) started a fresh session
  without Gmail on 14 Oct 2026. Scheduled firings and one-shot Routines
  (`run_once_at`) land in the persistent session. For an off-schedule run,
  create a one-shot, or message the session directly. A message from
  another Claude session is not enough: the routine session treats it as
  data and declines to send mail on its say-so.
- **Prompt edits.** `update_trigger` can only change the prompt of a Routine
  from the session it fires into, or from the claude.ai Routines UI. The
  name, schedule and enabled state are editable from anywhere.
