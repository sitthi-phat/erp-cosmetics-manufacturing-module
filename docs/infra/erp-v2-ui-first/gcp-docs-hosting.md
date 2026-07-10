# GCP Docs Hosting — เอกสาร ESSENCE Hub ขึ้น Cloud Run + IAP (allow เฉพาะ Google account ที่อนุญาต)

> เป้าหมาย: เอา **เอกสาร static HTML ทั้งหมด** (Document Hub / architecture / mockups / dashboard)
> ขึ้น GCP เพื่อให้ปอนด์และทีม review ได้จากทุกที่ โดย **เข้าถึงได้เฉพาะอีเมล Google ที่ allow รายตัว** — ไม่ public
>
> สถานะเอกสารนี้: **proposal + ของพร้อม deploy** — ยังไม่ deploy จริง รอปอนด์ยืนยัน
> (Phase ปัจจุบัน = local PC เท่านั้น; งานนี้คือ preview เฉพาะ "เอกสาร" ไม่ใช่ตัวแอปจริง)

---

## สรุปภาษาไทย (อ่าน 1 นาที)
- แนะนำ **Cloud Run (nginx เสิร์ฟ static) + IAP** — จำกัดสิทธิ์ราย Google account ผ่าน IAM ได้ตรงตามโจทย์ ถูกและง่ายสุด ใช้ URL `*.run.app` ได้เลยไม่ต้องมี domain
- ของพร้อมแล้ว 3 ไฟล์ใน `deploy/docs-site/`: `Dockerfile`, `nginx.conf`, `deploy.sh` (+ `cloudbuild.yaml`) — แก้ค่า `PROJECT_ID` กับรายชื่ออีเมลแล้วรัน `bash deploy/docs-site/deploy.sh` คำสั่งเดียว
- ค่าใช้จ่ายประมาณ **< 200 บาท/เดือน** (ส่วนใหญ่เกือบฟรีเพราะ traffic น้อย + scale-to-zero)
- ต้องการจากปอนด์: (1) GCP project id + เปิด billing, (2) รายชื่ออีเมลที่ allow, (3) อีเมลเหล่านั้นเป็น Google Workspace หรือ gmail ส่วนตัว (มีผลกับหน้า consent), (4) ต้องการ custom domain ไหม (ไม่มีก็ได้)
- อัปเดตเอกสารรอบใหม่ = รัน `deploy.sh` ซ้ำ 1 คำสั่ง (build ใหม่ + redeploy) — เพิ่ม/ถอนสิทธิ์คน = 1 คำสั่งต่อคน

---

## 1) เปรียบเทียบทางเลือก

| ทางเลือก | Auth ราย Google account | ค่าใช้จ่าย/เดือน (โดยประมาณ) | ความยาก | หมายเหตุ |
|---|---|---|---|---|
| **★ Cloud Run (nginx static) + IAP** | ได้ ผ่าน IAM `roles/iap.httpsResourceAccessor` รายอีเมล | ~ **0–200 บาท** (scale-to-zero, traffic น้อย) | ต่ำ | ใช้ URL `*.run.app` ได้เลย ไม่ต้องมี LB/domain; container-first ตรงกับ Phase 3-4 |
| Cloud Storage static + HTTPS LB + IAP | ได้ (IAP บน backend ของ LB) | ~ **600–900 บาท** (LB มีค่า fixed ~$18/mo แม้ traffic 0) | กลาง–สูง | ต้องตั้ง LB + SSL cert + serverless/backend bucket; แพงกว่าเพราะ LB มีค่าคงที่ |
| Firebase Hosting + Firebase Auth | ได้แต่ **ต้องเขียน auth/allow-list logic เอง** (แก้ทุกหน้า/เพิ่ม gate JS) | ~ **0 บาท** (free tier) | สูง (แตะ HTML) | ขัดกับข้อกำหนด "ไม่แตะ application code"; site เป็น static ล้วน การยัด auth ต้องดัดแปลงไฟล์ — ไม่แนะนำ |

**แนะนำ: Cloud Run + IAP** เพราะ (ก) allow ราย Google account ได้ที่ระดับ IAM โดย **ไม่ต้องแก้ HTML สักไฟล์**, (ข) ถูกสุดสำหรับ traffic ต่ำ (scale-to-zero + ไม่มีค่า LB คงที่), (ค) ใช้ `*.run.app` ได้ทันทีไม่ต้องซื้อ domain, (ง) เป็น container (nginx) ตรงแนว Phase 3-4 ที่จะขึ้น Cloud Run อยู่แล้ว — ไม่มี rework

---

## 2) สถาปัตยกรรมที่จะ deploy

```
ผู้ใช้ (เบราว์เซอร์)
   │  https://essence-docs-xxxx.asia-southeast1.run.app
   ▼
[ IAP ]  ← Google sign-in; ผ่านเฉพาะอีเมลที่มี roles/iap.httpsResourceAccessor
   │
   ▼
[ Cloud Run: essence-docs ]  --no-allow-unauthenticated (เข้าตรงไม่ได้ ต้องผ่าน IAP)
   │  container = nginx:alpine
   ▼
static files (mirror โครง repo):
   /                              → 302 ไป Document Hub
   /docs/design/erp-v2-ui-first/functional-spec/index.html   (หน้าแรก)
   /docs/design/erp-v2-ui-first/architecture/...
   /docs/design/erp-v2-ui-first/mockups/...
   /dashboard/  + /dashboard.html   (pipeline dashboard)
   /pipeline/status.json            (snapshot ณ ตอน build image)
```

**สำคัญเรื่องลิงก์:** ลิงก์ในเอกสารเป็น relative (`../mockups/`, `../architecture/`, `../pipeline/status.json`)
เราจึง copy ไฟล์เข้า image โดย**คงโครงพาธเดิม** (`/docs/design/erp-v2-ui-first/...`) ทุกลิงก์จึงทำงานเหมือน local

**หมายเหตุ dashboard:** ทั้ง `dashboard/index.html` และ `dashboard.html` fetch `pipeline/status.json`
เราจึง copy `pipeline/status.json` เข้า image ด้วย — **แต่เป็น snapshot ณ ตอน build** จะอัปเดตเมื่อ redeploy เท่านั้น (ไม่ใช่ live)

---

## 3) สิ่งที่ปอนด์ต้องเตรียม/ตอบก่อนเริ่ม

| # | ต้องการ | ทำไม / ค่าเริ่มต้นถ้าไม่ตอบ |
|---|---|---|
| 1 | **GCP project id** + เปิด **billing** | ต้องมี project ที่ผูก billing (IAP + Cloud Run ต้องใช้ แม้ค่าใช้จ่ายเกือบ 0). เครื่องนี้ตอนนี้ชี้ project `gen-lang-client-0453424159` (auto จาก AI Studio) — ควรใช้ project ใหม่/แยกสำหรับงานนี้ |
| 2 | **รายชื่ออีเมล Google ที่ allow** (รายตัว) | เอาไปใส่ `ALLOWED_EMAILS` ใน `deploy.sh`; แต่ละคน = 1 binding |
| 3 | อีเมลเหล่านั้นเป็น **Google Workspace domain** หรือ **gmail ส่วนตัว**? | ถ้าเป็น Workspace ทั้งหมด → OAuth consent = **Internal** (ง่าย); ถ้ามี gmail ส่วนตัว → ต้องตั้ง consent = **External** (แต่ IAP ยัง allow ราย email เหมือนเดิม). *ค่าเริ่มต้นที่คาด: gmail ส่วนตัว → External* |
| 4 | ต้องการ **custom domain** ไหม? | **ไม่จำเป็น** — IAP ทำงานกับ `*.run.app` ได้เลย. ถ้าต้องการ domain สวย ๆ ค่อยเพิ่ม Cloud Run domain mapping ทีหลัง (ยังใช้ IAP ตัวเดิม) |
| 5 | **Region** | ค่าเริ่มต้น **asia-southeast1 (สิงคโปร์)** — ใกล้ไทยสุด latency ต่ำ |

---

## 4) ขั้นตอน deploy (gcloud ทีละขั้น)

> รันจาก **root ของ repo** ทั้งหมด บนเครื่องที่ `gcloud auth login` แล้ว
> ทางลัด: แก้ค่าใน `deploy/docs-site/deploy.sh` แล้วรัน `bash deploy/docs-site/deploy.sh` (ทำ 4.2–4.7 ให้ครบในคำสั่งเดียว)
> ด้านล่างคือรายละเอียดแต่ละขั้นเผื่ออยากทำมือ/debug

### 4.0 ตั้งค่า (ครั้งเดียว)
```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud config set run/region asia-southeast1
```

### 4.1 (ครั้งแรกครั้งเดียว) ตั้ง OAuth consent screen — จำเป็นสำหรับ IAP
ทำผ่าน Console: **APIs & Services → OAuth consent screen**
- User type: **Internal** (ถ้าทุกอีเมลอยู่ใน Google Workspace org เดียวกัน) หรือ **External** (ถ้ามี gmail ส่วนตัว)
- ใส่ App name (เช่น "ESSENCE Hub Docs"), support email, developer email → Save
- ถ้าเลือก External: ปล่อยสถานะ **Testing** ได้ (ไม่ต้อง publish) — เพราะ IAP คุมสิทธิ์จริงด้วย IAM อยู่แล้ว

### 4.2 เปิด APIs
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com iap.googleapis.com
```

### 4.3 สร้าง Artifact Registry repo (ครั้งเดียว)
```bash
gcloud artifacts repositories create docs \
  --repository-format=docker --location=asia-southeast1 \
  --description="ESSENCE Hub static docs images"
```

### 4.4 Build + push image (ใช้ Cloud Build — ไม่ต้องมี Docker บนเครื่อง)
```bash
IMAGE="asia-southeast1-docker.pkg.dev/<PROJECT_ID>/docs/essence-docs:$(date +%Y%m%d-%H%M%S)"
gcloud builds submit --config deploy/docs-site/cloudbuild.yaml --substitutions=_IMAGE="$IMAGE"
```

### 4.5 Deploy ขึ้น Cloud Run (private)
```bash
gcloud run deploy essence-docs \
  --image="$IMAGE" --region=asia-southeast1 --platform=managed \
  --port=8080 --ingress=all --no-allow-unauthenticated \
  --cpu=1 --memory=256Mi --min-instances=0 --max-instances=2
```

### 4.6 เปิด IAP บน service
```bash
# สร้าง IAP service agent + ให้สิทธิ์ IAP เรียก Cloud Run
gcloud beta services identity create --service=iap.googleapis.com --project=<PROJECT_ID>
PROJECT_NUMBER=$(gcloud projects describe <PROJECT_ID> --format='value(projectNumber)')
gcloud run services add-iam-policy-binding essence-docs --region=asia-southeast1 \
  --member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-iap.iam.gserviceaccount.com" \
  --role="roles/run.invoker"

# เปิด IAP
gcloud beta iap web enable --resource-type=cloud-run --service=essence-docs --region=asia-southeast1
```

### 4.7 เพิ่ม principal รายคน (allow-list)
```bash
gcloud beta iap web add-iam-policy-binding \
  --resource-type=cloud-run --service=essence-docs --region=asia-southeast1 \
  --member="user:pond@example.com" \
  --role="roles/iap.httpsResourceAccessor"
# ทำซ้ำต่อ 1 คำสั่ง/คน
```

### 4.8 ทดสอบ
```bash
gcloud run services describe essence-docs --region=asia-southeast1 --format='value(status.url)'
```
- เปิด URL ที่ได้ → เจอหน้า Google sign-in ของ IAP
- ล็อกอินด้วยอีเมลที่ allow → เข้า Document Hub ได้
- ล็อกอินด้วยอีเมลที่ **ไม่ได้** allow → ขึ้น "You don't have access" (ถูกต้อง)

---

## 5) งานประจำ (ops)

### อัปเดตเอกสารรอบถัดไป (redeploy คำสั่งเดียว)
```bash
bash deploy/docs-site/deploy.sh
```
build image ใหม่ (รวม `status.json` snapshot ล่าสุด) + redeploy revision ใหม่ให้อัตโนมัติ
สิทธิ์ IAP ที่ให้ไว้แล้ว **ไม่หาย**

### เพิ่มคนเข้าถึง
```bash
gcloud beta iap web add-iam-policy-binding \
  --resource-type=cloud-run --service=essence-docs --region=asia-southeast1 \
  --member="user:newperson@gmail.com" --role="roles/iap.httpsResourceAccessor"
```

### ถอนสิทธิ์คน
```bash
gcloud beta iap web remove-iam-policy-binding \
  --resource-type=cloud-run --service=essence-docs --region=asia-southeast1 \
  --member="user:someone@gmail.com" --role="roles/iap.httpsResourceAccessor"
```

### ดูรายชื่อคนที่เข้าถึงได้ตอนนี้
```bash
gcloud beta iap web get-iam-policy --resource-type=cloud-run \
  --service=essence-docs --region=asia-southeast1
```

### ปิด/ลบชั่วคราว (หยุดค่าใช้จ่าย)
```bash
gcloud run services delete essence-docs --region=asia-southeast1   # ลบ service (image ยังอยู่ใน AR)
```

---

## 6) ค่าใช้จ่ายประมาณการ/เดือน (traffic รีวิวภายในทีม, น้อย)

| รายการ | ประมาณการ |
|---|---|
| Cloud Run (scale-to-zero, min=0, ใช้จริงไม่กี่ชม./เดือน) | ~ 0–100 บาท (มี free tier 2M req + 180k vCPU-s/เดือน) |
| Artifact Registry (เก็บ image ~30–50 MB) | ~ 0–15 บาท |
| Cloud Build (build สั้น ๆ ครั้งละ ~1–2 นาที) | ~ 0 บาท (มี free 120 build-min/วัน) |
| IAP | ฟรี (คิดตาม Cloud Run ที่อยู่ข้างหลัง) |
| **รวมโดยประมาณ** | **< 200 บาท/เดือน** (มักใกล้ ~0 เพราะ scale-to-zero) |

> เทียบทางเลือก LB+IAP จะเพิ่มค่า Load Balancer คงที่ ~$18/เดือน (~650 บาท) แม้ไม่มี traffic — จึงไม่คุ้มสำหรับงานนี้

---

## 7) ปัญหาที่พบบ่อย (troubleshooting)

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| เปิด URL แล้วขึ้น "You don't have access" ทั้งที่ควรมีสิทธิ์ | ยังไม่ได้เพิ่ม `roles/iap.httpsResourceAccessor` ให้อีเมลนั้น (ขั้น 4.7) หรือรอ IAM propagate 1–2 นาที |
| ขึ้น error ว่ายังไม่ได้ตั้ง OAuth consent screen | ทำขั้น 4.1 ก่อน (จำเป็นครั้งแรกครั้งเดียว) |
| ลิงก์ในหน้าเอกสารกดแล้ว 404 | image ไม่ได้ copy โครงพาธครบ — ตรวจว่า build จาก **root ของ repo** (context = `.`) ตาม `cloudbuild.yaml` |
| dashboard โหลด status.json ไม่ขึ้น/ข้อมูลเก่า | เป็น snapshot ณ ตอน build — รัน `deploy.sh` ใหม่เพื่อ refresh |
| ตัวอักษรไทยเพี้ยน (mojibake) | ไฟล์ HTML ประกาศ `charset=utf-8` อยู่แล้ว + nginx.conf ตั้ง `charset utf-8` — ถ้าเพี้ยนแปลว่าไฟล์ต้นทางเพี้ยนเอง |
| deploy ไม่ผ่านเพราะ IAP service agent ยังไม่มี | รัน `gcloud beta services identity create --service=iap.googleapis.com` (อยู่ในขั้น 4.6 แล้ว) |
| อยากได้ domain ตัวเอง | เพิ่ม `gcloud run domain-mappings create` ภายหลัง — IAP เดิมยังคุมสิทธิ์ต่อได้ |

---

## 8) ขอบเขต / ข้อควรระวัง
- งานนี้ publish **เฉพาะเอกสาร static** — ไม่ใช่แอปจริง (แอปจริง React+Node+MySQL จะขึ้น Cloud Run + Cloud SQL ใน Phase 3-4 แยกต่างหาก)
- `pipeline/status.json` ที่ขึ้นไปเป็น **snapshot** — ไม่ควรถือเป็น source of truth (ตัวจริงอยู่ใน repo)
- ยังไม่มี secret ใด ๆ ในของชุดนี้ (static ล้วน + ไม่มี API key) — ไม่มีอะไรต้องกันหลุด git; ถ้าอนาคตต้องใส่ค่า ให้แยกเป็น env var ของ Cloud Run เสมอ
- อย่า commit `PROJECT_ID`/อีเมลจริงลง git ถ้าไม่จำเป็น — `deploy.sh` ใช้ placeholder ไว้ให้แก้เฉพาะตอนรัน
