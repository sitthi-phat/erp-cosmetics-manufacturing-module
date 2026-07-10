# GCP Docs Hosting — เอกสาร ESSENCE Hub ขึ้น Cloud Run + oauth2-proxy (allow เฉพาะ Google account ที่อนุญาต)

> เป้าหมาย: เอา **เอกสาร static HTML ทั้งหมด** (Document Hub / architecture / mockups / dashboard)
> ขึ้น GCP เพื่อให้ปอนด์และทีม review ได้จากทุกที่ โดย **เข้าถึงได้เฉพาะอีเมล Google ที่ allow รายตัว** — ไม่ public
>
> Phase ปัจจุบัน = local PC เท่านั้น; งานนี้คือ preview เฉพาะ "เอกสาร" ไม่ใช่ตัวแอปจริง

---

## สรุปภาษาไทย (อ่าน 1 นาที)
- ใช้ **Cloud Run (nginx เสิร์ฟ static) + oauth2-proxy (Google login) ใน container เดียว** — จำกัดสิทธิ์ราย Google account ผ่าน allow-list ไฟล์ ใช้ URL `*.run.app` ไม่ต้องมี LB/domain ค่าใช้จ่าย ~0
- **เดิมวางไว้เป็น IAP แต่ใช้ไม่ได้** เพราะ project ไม่มี Google Cloud org → IAP direct-on-Cloud-Run หา Google-managed OAuth client ไม่ได้ (error "Empty Google Account OAuth client" / 502) จึง **pivot มา oauth2-proxy** (ดู §0)
- ของพร้อมใน `deploy/docs-site/`: `Dockerfile`, `nginx.conf`, `oauth2-proxy.cfg`, `authenticated-emails.txt`, `start.sh`, `cloudbuild.yaml`, `deploy.sh` + `oauth.env.example` — เติม `oauth.env` แล้วรัน `bash deploy/docs-site/deploy.sh` คำสั่งเดียว
- ค่าใช้จ่ายประมาณ **< 200 บาท/เดือน** (มักใกล้ ~0 เพราะ scale-to-zero)
- **ปอนด์ต้องทำ 2 ขั้น**: (1) เติม client id/secret ใน `deploy/docs-site/oauth.env` (gitignored), (2) เพิ่ม redirect URI ใน OAuth client
- เพิ่ม/ถอนอีเมล = แก้ `authenticated-emails.txt` แล้ว redeploy 1 คำสั่ง

---

## 0) ทำไมเปลี่ยนจาก IAP → oauth2-proxy (สำคัญ — อ่านก่อน)

แผนแรกคือ **IAP direct-on-Cloud-Run** (จำกัดสิทธิ์ที่ระดับ IAM) แต่ติดปัญหาจริงหน้างาน:
- project `essence-hub-502015` **ไม่มี Google Cloud organization** (เป็น gmail ส่วนตัว ไม่ใช่ Workspace) → IAP รุ่น direct-on-Cloud-Run ต้องมี **Google-managed OAuth client** ซึ่งไม่ถูกสร้างให้เมื่อไม่มี org
- ผล: error **"Empty Google Account OAuth client"** ค้าง **502** แม้ toggle IAP ใหม่ และหน้า IAP console ไม่มีช่องให้ใส่ custom OAuth client สำหรับ resource แบบ cloud-run
- `gcloud iap web enable --resource-type=cloud-run` ทุก track ไม่รับ resource นี้

**ทางออก: oauth2-proxy** (open-source, official binary) นั่งหน้า nginx ใน container เดียวกัน — ทำ Google OAuth เองด้วย **custom OAuth client** (ที่ปอนด์สร้างเอง) และ allow-list อีเมลจากไฟล์ คงเป้าค่าใช้จ่าย ~0 และไม่ต้องมี Load Balancer

> สถานะ GCP ปัจจุบัน (อย่ารื้อ): Cloud Run `essence-docs` deploy สำเร็จแล้ว, image ใช้ได้, ตอน deploy ใหม่ด้วยสคริปต์นี้จะปิด IAP (`--no-iap`) + เปิด `--allow-unauthenticated` (auth ไปอยู่ที่ oauth2-proxy แทน). IAP accessor ที่ผูก 2 อีเมลไว้ไม่ได้ใช้แล้วก็ไม่เป็นไร

---

## 1) เปรียบเทียบทางเลือก

| ทางเลือก | Auth ราย Google account | ค่าใช้จ่าย/เดือน | ความยาก | หมายเหตุ |
|---|---|---|---|---|
| **★ Cloud Run + oauth2-proxy (ที่เลือก)** | ได้ ผ่าน allow-list ไฟล์ในภาพ | ~ **0–200 บาท** (scale-to-zero) | ต่ำ–กลาง | ใช้ `*.run.app` ไม่ต้องมี org/LB; ทำงานแม้ project ไม่มี org; ต้องมี custom OAuth client |
| Cloud Run + IAP (แผนเดิม) | ได้ ผ่าน IAM | ~ 0–200 บาท | — | **ใช้ไม่ได้กับ project ที่ไม่มี org** (ดู §0) |
| Cloud Storage + HTTPS LB + IAP | ได้ | ~ 600–900 บาท (LB คงที่ ~$18/mo) | กลาง–สูง | แพงเพราะ LB คงที่ |
| Firebase Hosting + Firebase Auth | ต้องเขียน auth logic เอง (แตะ HTML) | ~ 0 บาท | สูง | ขัดข้อกำหนด "ไม่แตะ application code" |

---

## 2) สถาปัตยกรรมที่จะ deploy

```
ผู้ใช้ (เบราว์เซอร์)
   │  https://essence-docs-238060462485.asia-southeast1.run.app
   ▼
[ Cloud Run: essence-docs ]  --allow-unauthenticated (auth อยู่ที่ proxy)
   │  container เดียว:
   │    oauth2-proxy  ฟัง :8080 (Cloud Run port) ─ Google login + allow-list
   │        │ ผ่าน auth แล้ว forward ไป
   │        ▼
   │    nginx        ฟัง 127.0.0.1:8081 ─ เสิร์ฟ static files
   ▼
static files (mirror โครง repo):
   /                              → 302 ไป Document Hub
   /docs/design/erp-v2-ui-first/functional-spec/index.html   (หน้าแรก)
   /docs/design/erp-v2-ui-first/architecture/... , /mockups/...
   /dashboard/ + /dashboard.html   (pipeline dashboard)
   /pipeline/status.json           (snapshot ณ ตอน build image)
   /oauth2/*                       ← oauth2-proxy จัดการเอง (login/callback)
```

**สำคัญเรื่องลิงก์:** ลิงก์ในเอกสารเป็น relative — copy ไฟล์เข้า image โดยคงโครงพาธเดิม (`/docs/design/erp-v2-ui-first/...`) ทุกลิงก์จึงทำงานเหมือน local

**หมายเหตุ dashboard:** `dashboard/index.html` + `dashboard.html` fetch `pipeline/status.json` — copy เข้า image ด้วย **แต่เป็น snapshot ณ ตอน build** (อัปเดตเมื่อ redeploy)

**secret แยกจาก image:** allow-list (อีเมล) baked เข้า image ได้ (ไม่ใช่ secret) แต่ **client id/secret/cookie secret ไม่ bake** — ส่งผ่าน env var บน Cloud Run เท่านั้น

---

## 3) สิ่งที่ปอนด์ต้องเตรียม (2 ขั้น)

### ขั้น A — เติม OAuth client credentials ลง `deploy/docs-site/oauth.env`
ไฟล์นี้ **gitignored แล้ว** (ห้าม commit) — template อยู่ที่ `oauth.env.example`
```
OAUTH2_PROXY_CLIENT_ID=<client id>.apps.googleusercontent.com
OAUTH2_PROXY_CLIENT_SECRET=<client secret>
```
เอาค่าจาก OAuth 2.0 Client (type: **Web application**) ที่ปอนด์สร้างไว้ (ชื่อ `essence-docs-iap`)
(cookie secret ไม่ต้องใส่ — `deploy.sh` gen ใหม่ทุกครั้ง)

### ขั้น B — เพิ่ม redirect URI ใน OAuth client
Console: **Google Auth Platform → Clients → `essence-docs-iap` → Authorized redirect URIs → ADD**
```
https://essence-docs-238060462485.asia-southeast1.run.app/oauth2/callback
```
ต้องตรงเป๊ะกับ `redirect_url` ใน `oauth2-proxy.cfg` มิฉะนั้น login จะ error `redirect_uri_mismatch`

> OAuth consent screen: ตั้งเป็น **External / Testing** ได้ (gmail ส่วนตัว) — ไม่ต้อง publish; ควบคุมคนเข้าจริงที่ allow-list

---

## 4) ขั้นตอน deploy

> รันจาก **root ของ repo** บนเครื่องที่ `gcloud auth login` + `gcloud config set project essence-hub-502015` แล้ว
> ทางลัด (แนะนำ): `bash deploy/docs-site/deploy.sh` — ทำ 4.1–4.4 ให้ครบในคำสั่งเดียว
> เงื่อนไข: ทำขั้น A + B (§3) ให้เสร็จก่อน

### 4.1 เปิด APIs (ไม่ต้องมี iap แล้ว)
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

### 4.2 Artifact Registry (ครั้งเดียว — มีอยู่แล้วจากรอบก่อนก็ข้าม)
```bash
gcloud artifacts repositories create docs \
  --repository-format=docker --location=asia-southeast1 \
  --description="ESSENCE Hub static docs images"
```

### 4.3 Build + push image (Cloud Build — ไม่ต้องมี Docker บนเครื่อง)
```bash
IMAGE="asia-southeast1-docker.pkg.dev/essence-hub-502015/docs/essence-docs:$(date +%Y%m%d-%H%M%S)"
gcloud builds submit --config deploy/docs-site/cloudbuild.yaml --substitutions=_IMAGE="$IMAGE"
```

### 4.4 Deploy ขึ้น Cloud Run (auth = oauth2-proxy, ปิด IAP)
```bash
# โหลด client id/secret + gen cookie secret
set -a; source deploy/docs-site/oauth.env; set +a
COOKIE="$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')"

gcloud run deploy essence-docs \
  --image="$IMAGE" --region=asia-southeast1 --platform=managed \
  --port=8080 --ingress=all --allow-unauthenticated --no-iap \
  --cpu=1 --memory=256Mi --min-instances=0 --max-instances=2 \
  --set-env-vars="^@^OAUTH2_PROXY_CLIENT_ID=${OAUTH2_PROXY_CLIENT_ID}@OAUTH2_PROXY_CLIENT_SECRET=${OAUTH2_PROXY_CLIENT_SECRET}@OAUTH2_PROXY_COOKIE_SECRET=${COOKIE}"
```

### 4.5 ทดสอบ
```bash
curl -sI https://essence-docs-238060462485.asia-southeast1.run.app/
```
- คาดหวัง **HTTP 302 → accounts.google.com** (แปลว่า oauth2-proxy ทำงาน กันคนนอกได้ — **ไม่ใช่ 200**)
- เปิดในเบราว์เซอร์ → Google sign-in; login ด้วยอีเมลใน allow-list → เข้า Document Hub ได้
- อีเมลนอก allow-list → oauth2-proxy ปฏิเสธ (403)

---

## 5) งานประจำ (ops)

### อัปเดตเอกสารรอบถัดไป (redeploy คำสั่งเดียว)
```bash
bash deploy/docs-site/deploy.sh
```
build image ใหม่ (รวม `status.json` snapshot ล่าสุด) + redeploy revision ใหม่

### เพิ่ม/ถอนอีเมลที่เข้าถึงได้
แก้ไฟล์ `deploy/docs-site/authenticated-emails.txt` (1 อีเมล/บรรทัด) แล้ว redeploy:
```bash
# ...แก้ไฟล์...
bash deploy/docs-site/deploy.sh
```
(allow-list ฝังใน image — เปลี่ยนแล้วต้อง build+deploy ใหม่ จึงจะมีผล)

### ดูรายชื่อที่เข้าถึงได้ตอนนี้
```bash
cat deploy/docs-site/authenticated-emails.txt
```

### ปิด/ลบชั่วคราว (หยุดค่าใช้จ่าย)
```bash
gcloud run services delete essence-docs --region=asia-southeast1
```

---

## 6) ค่าใช้จ่ายประมาณการ/เดือน (traffic รีวิวภายในทีม, น้อย)

| รายการ | ประมาณการ |
|---|---|
| Cloud Run (scale-to-zero, min=0) | ~ 0–100 บาท (free tier 2M req + 180k vCPU-s/เดือน) |
| Artifact Registry (image ~40–60 MB) | ~ 0–15 บาท |
| Cloud Build (build ~1–2 นาที/ครั้ง) | ~ 0 บาท (free 120 build-min/วัน) |
| oauth2-proxy | ฟรี (open-source, รันใน container เดิม) |
| **รวมโดยประมาณ** | **< 200 บาท/เดือน** (มักใกล้ ~0) |

---

## 7) ปัญหาที่พบบ่อย (troubleshooting)

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| login แล้ว error `redirect_uri_mismatch` | ยังไม่ได้เพิ่ม redirect URI ใน OAuth client (§3 ขั้น B) หรือพิมพ์ไม่ตรง `.../oauth2/callback` |
| curl `/` ได้ 200 ตรง ๆ (ไม่ redirect) | oauth2-proxy ไม่ทำงาน — ตรวจ env vars (client id/secret) ถูกส่งเข้า Cloud Run และ container start ไม่ error |
| ขึ้น 403 "Permission Denied" หลัง login | อีเมลไม่อยู่ใน `authenticated-emails.txt` — เพิ่มแล้ว redeploy |
| deploy fail "still holds placeholder values" | ยังไม่ได้เติมค่าจริงใน `oauth.env` (§3 ขั้น A) |
| ลิงก์ในหน้าเอกสารกด 404 | image ไม่ได้ copy โครงพาธครบ — build ต้องมาจาก **root ของ repo** (context `.`) |
| dashboard โหลด status.json เก่า | เป็น snapshot ณ ตอน build — รัน `deploy.sh` ใหม่เพื่อ refresh |
| ตัวอักษรไทยเพี้ยน | HTML ประกาศ `charset=utf-8` + nginx.conf ตั้ง `charset utf-8` — ถ้าเพี้ยนแปลว่าไฟล์ต้นทางเพี้ยน |
| 502 ตอนเปิด (จาก IAP เดิม) | deploy ใหม่ด้วย `deploy.sh` จะ `--no-iap` + `--allow-unauthenticated` ทับให้ auth ไปที่ proxy |

---

## 8) ขอบเขต / ข้อควรระวัง (security)
- publish **เฉพาะเอกสาร static** — ไม่ใช่แอปจริง (แอปจริง React+Node+MySQL ขึ้น Phase 3-4 แยก)
- `pipeline/status.json` ที่ขึ้นไปเป็น **snapshot** — ไม่ใช่ source of truth (ตัวจริงอยู่ใน repo)
- **secret ทั้งหมดอยู่นอก git**: `deploy/docs-site/oauth.env` ถูก gitignore; client secret + cookie secret ส่งผ่าน env var ของ Cloud Run เท่านั้น — **ไม่ bake ลง image, ไม่ commit**
- `authenticated-emails.txt` เก็บแค่ที่อยู่อีเมล (ไม่ใช่ secret) — commit ได้
- cookie secret gen ใหม่ทุก deploy (session เดิมจะถูก invalidate ตอน redeploy — ผู้ใช้ login ใหม่ ถือว่าปกติ)
