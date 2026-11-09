# handOver.md — TP SOA (ISET Tozeur), continuation in a new account

> Read this whole file first, then continue where it stops (section 6: TP2).
> Written on 2026-11-09 at the end of TP1.

---

## 1. Who the user is and how to talk to him

- **Ahmed Bouguerra**, student, group **DSI 31**, ISET Tozeur (department Technologies de l'Informatique).
- Writes in **Tunisian arabizi** (Latin letters, 3 = ع, 7 = ح, 9 = ق, 5 = خ, 8/gh = غ...). **Reply in Tunisian arabizi**, short sentences, no heavy formatting. Documents for the teacher (compte rendu) are in **French**.
- Works on **Windows + PowerShell** (not CMD). Project root: `C:\tpSOA`.
- He has **no Postman** installed: **always give terminal-based steps** (PowerShell, `curl.exe`, small `node` scripts). Never ask him to use Postman or SoapUI without checking first.
- He likes: **step by step** instructions, **all files in one zip + PowerShell commands** to put them in place, **Word (.docx)** for the compte rendu, and **a ready prompt for the `opencode` CLI** for anything the CLI can do (generate / test / fix code). He runs opencode himself and pastes its report back.
- He pastes terminal output and screenshots to check progress. Read them carefully: several "bugs" were caused by his setup (see section 4).
- If a document is missing for a TP, tell him exactly what is missing and ask for it.

## 2. The assignment

Teacher: **Abdelkader Ben Maatallah**. Module **Architecture Orientée Services (SOA)**, year 2026–2027, groups DSI 31 & 32. The statement is a PDF (`TP_SOA_DSI_31-32.pdf`) with **6 TP** around one theme: the ISET Tozeur library information system.

| TP | Theme |
|----|-------|
| 1 | Node.js env + first HTTP service (native `http`, Express, middlewares, calculator) |
| 2 | REST CRUD API for books, in memory (validation, filter, sort, pagination) |
| 3 | MongoDB + Mongoose + central error middleware + OpenAPI/Swagger |
| 4 | SOAP with `node-soap` (WSDL, server, client, SOAP Fault, REST→SOAP gateway) |
| 5 | Security: bcrypt, JWT, roles, CORS, helmet, rate limiting, web client |
| 6 | Microservices + API Gateway + Docker Compose |

**Deliverables per TP:** project folder zipped **without `node_modules`**, named `TPx_Nom_Prenom.zip` (he uses `TP1_Ahmed_Bouguerra_final.zip`), plus a **compte rendu of 2–4 pages** (answers to the questions + screenshots). Code must be commented and start with `npm start`.

Environment: Node **v24.21.0**, npm **12.0.2**, Express **^5.x**, nodemon 3.x. TP3/TP5 need MongoDB (or Atlas), TP4 SoapUI (not available → use node client / curl), TP6 Docker Desktop. **Ask him what he has installed before TP3, TP4 and TP6.**

## 3. TP1 — status: finished, only the final delivery check is left

Files in `C:\tpSOA\tp1-soa`: `http-natif.js`, `server.js`, `tests.http`, `package.json`, `package-lock.json`, `CR_TP1_SOA_final.docx` (compte rendu, 6 pages, 14 numbered figures, Q1–Q5 answered, name filled in).

- `http-natif.js`: native server on port 3000. `/` 200, `/info` 200 (method, url, date), anything else 404 `{"erreur":"Ressource introuvable"}`.
- `server.js`: Express on port 3000, logging middleware (`[date] METHOD URL CODE - N ms`), `express.json()`, routes `/`, `/api/hello`, `/api/hello/:nom?lang=fr|en|ar` (400 if other), `/api/date`, `POST /api/echo`, `GET` + `POST /api/calc` sharing one `calculer()` function, JSON 404 at the end, JSON-parse error handler.
- `C:\tpSOA\tester.js` (outside the project): sends 12 requests and prints status + body. Opencode ran everything: **18/18 PASS**.
- The compte rendu was built with docx-js from his own screenshots. Wrong screenshots (Express shown in the native-server section) were removed on purpose.

**Left to do for TP1 (ask him if done):**
1. Check `server.js` has `app.use(express.json());` **without `//`** (`Select-String "express.json" server.js`). He commented it out temporarily for a screenshot.
2. Copy the docx into `tp1-soa`, then create the zip:
   ```powershell
   copy "$env:USERPROFILE\Downloads\CR_TP1_SOA_final.docx" C:\tpSOA\tp1-soa\
   cd C:\tpSOA
   tar -a -c -f TP1_Ahmed_Bouguerra_final.zip --exclude=node_modules tp1-soa
   tar -tf TP1_Ahmed_Bouguerra_final.zip
   ```
   The listing must show the 5 project files + the docx and **no `node_modules`**.

## 4. Gotchas already met (avoid repeating them)

- **PowerShell, not CMD**: `%USERPROFILE%` → `$env:USERPROFILE`; no `cd /d` needed; unzip with `Expand-Archive` (or `tar -xf`); `curl` is an alias → type **`curl.exe`**.
- In PowerShell, **URLs containing `&` must be in quotes**.
- Sending JSON with curl without quoting problems: pipe it on stdin  
  `'{"a":1}' | curl.exe -i -X POST "http://localhost:3000/api/echo" -H "Content-Type: application/json" --data-binary "@-"`
- If he pastes example log lines into PowerShell he gets `Missing type name after '['`: tell him those lines are **output, not commands**.
- **Port 3000 conflicts**: native server and Express use the same port. An old process kept answering and gave confusing results (e.g. Express headers `X-Powered-By` while testing the native server, `ECONNREFUSED` when nothing ran). Kill the owner with  
  `Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
- Express 5: without `express.json()`, `req.body` is `undefined` (echo returns `"recu":{}`).
- The native server sends `Transfer-Encoding: chunked` (no `Content-Length`); the Q2 table was adapted.
- Before taking final screenshots always restart the server so it runs the current file.
- To comment / uncomment a line without opening an editor he uses a `node -e "…replace(…)"` one-liner (accents in files break `Get-Content | Set-Content` on PowerShell 5.1).

## 5. Standard workflow that worked for each TP

1. Read the TP part of the PDF; list what's missing (documents, tools).
2. Generate **all project files**, check syntax, put them in **one zip** (`TPx_files.zip`), and give PowerShell commands: create folder → `npm init -y` → install deps → `npm pkg set scripts.start=… scripts.dev=…` → `Expand-Archive` → run.
3. Give a **terminal test plan** (curl.exe / a `tester.js`) and optionally an **opencode prompt** that tests everything and reports PASS/FAIL without touching unrelated files.
4. Give the **answers to the questions** (Q1…Qn) briefly, in arabizi, and put the French versions in the compte rendu.
5. Build the **compte rendu .docx** (docx-js, French, tables for answers, numbered figures with captions). He sends the docx he edited with his screenshots; reorganise them in place, drop wrong/duplicate ones, and list what is missing or extra.
6. Final zip (`--exclude=node_modules`) and `tar -tf` to verify.

## 6. TP2 — status: files generated, NOT yet run by the user

I could not run it in my sandbox (no network, Express not installable), so the code was only **syntax-checked** (`node --check`). **First job: help him run it and fix whatever fails.**

`TP2_files.zip` (should be in his Downloads) contains: `server.js`, `data/livres.js`, `routes/livres.routes.js`, `controllers/livres.controller.js`, `middlewares/validerLivre.js`, `TP2_Bibliotheque.postman_collection.json` (23 requests with tests; **useless to him without Postman** → replace by a terminal tester, see below). If the zip is lost, regenerate from this spec:

**Project:** `C:\tpSOA\tp2-bibliotheque`, port 3000, in-memory data (seed: 3 books — Clean Code / Robert C. Martin / 2008 / 9780132350884 / available; Le Petit Prince / Antoine de Saint-Exupéry / 1943 / 9782070612758 / not available; Design Patterns / Erich Gamma / 1994 / 9780201633610 / available). Resource fields: `id, titre, auteur, annee, isbn, disponible`.

| Method | URI | Codes |
|--------|-----|-------|
| GET | `/api/livres` (filters, sort, pagination) | 200 (400 on bad query) |
| GET | `/api/livres/:id` | 200, 404 |
| POST | `/api/livres` | 201 + `Location: /api/livres/<id>`, 400, 409 (duplicate ISBN) |
| PUT | `/api/livres/:id` (full replace) | 200, 400, 404, 409 |
| PATCH | `/api/livres/:id` (partial) | 200, 400, 404 (+409 if ISBN belongs to another book — my addition) |
| DELETE | `/api/livres/:id` | 204 no body, 404 |

- **Validation middleware** `validerLivre` (POST/PUT/PATCH) → 400 `{ "erreurs": [...] }`: `titre`/`auteur` missing or empty; `annee` not an integer in [1450, current year]; `isbn` missing. For PATCH only fields present are checked (empty body → 400). `disponible`, if present, must be boolean.
- **Query params** of GET list: `auteur` (case-insensitive contains), `disponible=true|false`, `sort` + `order=asc|desc`, `page` (default 1) + `limit` (default 10). Response: `{ "total", "page", "limit", "data": [...] }` (`total` = after filtering, before pagination).
- Layers: routes → controllers → middlewares → data; JSON 404 and error handler at the end of `server.js`; same logging middleware as TP1.

**TP2 questions (answers already given to him in arabizi; put them in French in the compte rendu):**
- Q1 table — GET: safe yes / idempotent yes; POST: no / no; PUT: no / yes; PATCH: no / not guaranteed; DELETE: no / yes.
- Q2 PUT replaces the whole resource (all fields required, missing ones are lost/reset), PATCH changes only the sent fields (e.g. `PATCH /livres/1 {"disponible":false}` keeps title/author).
- Q3 URIs name **resources** (plural nouns); the HTTP method is the action; `/getLivres` mixes both and breaks REST conventions.
- Q4 In-memory storage: data lost on restart (back to the 3 seed books), not durable, not shared between instances, limited by RAM.

**Next steps for TP2 (terminal only, he has no Postman):**
1. Create folder, install `express` + `nodemon`, unzip, `npm run dev`; stop any old process on port 3000 first.
2. Write a **`tester.js`** (like TP1's) or a `tests.http` / curl list covering every endpoint, nominal + errors (400, 404, 409), filters, sorting, pagination, `Location` header, 204. Optionally an opencode prompt that runs it and reports PASS/FAIL.
3. He takes terminal screenshots; build the **TP2 compte rendu .docx** (same layout as TP1's; includes the Q1–Q4 answers and the Q1 table).
4. Zip `TP2_Ahmed_Bouguerra.zip` without `node_modules` (a Postman export is not required to be usable by him; the statement asks for it, so mention the JSON collection included or explain he used terminal tests).

## 7. After TP2

- **TP3** (MongoDB + Swagger): ask if MongoDB Community / Compass is installed or if he will use Atlas; `.env` + `.gitignore`; models `Livre`, `Auteur`; async controllers; central error middleware; swagger-jsdoc comments.
- **TP4** (SOAP): `soap` + `express`; no SoapUI → test with a node client and `curl.exe` (needs `Content-Type: text/xml` and a `SOAPAction` header).
- **TP5** (JWT): bcryptjs, jsonwebtoken, roles, helmet, cors, rate limit, small HTML client (his Live Server is on port 5500).
- **TP6** (microservices): needs **Docker Desktop**; ask first.

## 8. First message to send in the new account

Paste this to start:

```
Read handOver.md (attached). I'm Ahmed. TP1 is done. Let's continue with TP2:
help me run the generated TP2 files from the terminal (no Postman), then build the tester and the compte rendu.
```

Attach `handOver.md`, `TP_SOA_DSI_31-32.pdf`, and `TP2_files.zip` (if you still have it).
