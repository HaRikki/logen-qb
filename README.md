# Premium Bio — Link-in-Bio Website

សាមញ្ញ ស្អាត ហើយលឿន — HTML + CSS + JavaScript សុទ្ធ (គ្មាន build, គ្មាន backend)។
Pure static site: deploy anywhere (Vercel, Render, Netlify, GitHub Pages, Cloudflare Pages).

## មុខងារ / Features

- Loading screen, ប្រវត្តិរូប (logo, ឈ្មោះ, bio, status, badge)
- ប៊ូតុង Link វិលជុំវិញ logo មានឈ្មោះនៅក្រោម + Dock នៅបាត
- **ចុចប៊ូតុង = ចូល Link ភ្លាមៗ** ក្នុង tab ដដែល (ប្តូរបានក្នុង Admin → Links → "Open in New Tab")
- វីដេអូផ្ទៃខាងក្រោយមានចលនា (មានរូបថតរំកិលជាជំនួស បើ browser មិនចាក់វីដេអូ)
- Music player (YouTube ឬឯកសារ), Popup, Effects, Maintenance mode
- Hidden Admin: **ចុច logo 5 ដង** → បញ្ចូលពាក្យសម្ងាត់ (សូមប្តូរពាក្យសម្ងាត់ភ្លាមក្នុង Admin → Security)

## រចនាសម្ព័ន្ធ / Structure

```
index.html        ទំព័រសាធារណៈ
admin.html        Admin panel
config.js         ការកំណត់សម្រាប់ភ្ញៀវទាំងអស់ (មើលខាងក្រោម)
css/  style.css admin.css
js/   app.js storage.js music.js effects.js popup.js analytics.js admin.js
assets/ background/{bg.mp4,poster.jpg}  logo/logo.jpg
vercel.json       ការកំណត់ Vercel
render.yaml       ការកំណត់ Render (Blueprint)
```

## សំខាន់៖ ការកែប្រែក្នុង Admin ឱ្យភ្ញៀវគ្រប់គ្នាឃើញ

Admin រក្សាទុកក្នុង **LocalStorage របស់ browser អ្នក** ដូច្នេះភ្ញៀវ (Chrome / Telegram / ទូរស័ព្ទផ្សេង) មិនឃើញការកែភ្លាមៗទេ។

**វិធី Publish (ងាយបំផុត):**

1. ចូល Admin → កែ → **Save**
2. Admin → **Backup** → ចុច **Copy Publish Code**
3. បើក `config.js` → បិទភ្ជាប់ code ដែល copy (ជំនួស `null`)
4. Deploy ឡើងវិញ (git push / Vercel / Render) → ភ្ញៀវទាំងអស់ឃើញប៊ូតុង និងការកំណត់ថ្មី

**ជម្រើសទី ២ — Remote JSON URL (មិនចាំបាច់ redeploy site ទាំងមូល):**
- Export JSON ឬ Copy code → រក្សាទុកជា `.json` នៅ GitHub / public host
- ក្នុង `config.js` កំណត់៖  
  `window.__REMOTE_CONFIG_URL__ = 'https://raw.githubusercontent.com/.../config.json';`
- បន្ទាប់ពី Admin កែ ត្រឹមតែ update ឯកសារ JSON នោះ ភ្ញៀវនឹងឃើញភ្លាម (refresh)

គន្លឹះ៖ ដាក់ logo / background / ចម្រៀងជាឯកសារក្នុង `assets/` ហើយប្រើផ្លូវ (path) ជំនួសការ upload ក្នុង Admin ដើម្បីកុំឱ្យ `config.js` ធំ។

ចំណាំសុវត្ថិភាព៖ ពាក្យសម្ងាត់ Admin ត្រួតពិនិត្យនៅ browser ប៉ុណ្ណោះ (មិនមែនសុវត្ថិភាពពិតប្រាកដ)។
ប៉ុន្តែអ្នកផ្សេងមិនអាចកែ `config.js` របស់អ្នកបានទេ ព្រោះវាស្ថិតក្នុង repo/hosting របស់អ្នក។

---

## ⚠️ សំខាន់មុន Deploy (មិនឱ្យ UI បាត់)

**ត្រូវ upload ឯកសារ + ថតទាំងអស់**៖ `index.html`, `admin.html`, `config.js`, `vercel.json`, **`css/`**, **`js/`**, **`assets/`**

បើ upload តែ `index.html` → ទំព័រនឹងបង្ហាញតែអក្សរ Maintenance / ទទេ (CSS + JS 404)។

រចនាសម្ព័ន្ធត្រូវតែដូចនេះនៅ **root** នៃ project (មិនមែន nested folder):
```
index.html
admin.html
config.js
vercel.json
css/style.css
js/app.js
assets/logo/logo.jpg
assets/background/bg.mp4
...
```

## Deploy លើ Vercel

**វិធី A — តាម GitHub (ណែនាំ)**
1. បង្កើត repo លើ GitHub → upload **ឯកសារទាំងអស់** (ឬ unzip រួច `git push`)
2. vercel.com → **Add New… → Project** → Import repo
3. **Framework Preset: Other** · Build Command: **ទទេ** · Output Directory: **ទទេ** · Root Directory: `./`
4. ចុច **Deploy**

**វិធី B — តាម CLI**
```bash
npm i -g vercel
cd <folder-ដែល-មាន-index.html>
vercel          # លើកដំបូង (ជ្រើស "Other")
vercel --prod
```

**វិធី C — Drag & Drop**
1. Unzip package នេះ
2. vercel.com → **Add New… → Project** → ប្រើ **Deploy** ឬ CLI
3. កុំ upload តែ file មួយ — ត្រូវមាន folder `css`, `js`, `assets` ផង

## Deploy លើ Render

**វិធី A — Static Site (ងាយបំផុត)**
1. បង្កើត repo លើ GitHub ហើយ push ឯកសារទាំងអស់
2. render.com → **New + → Static Site** → ភ្ជាប់ repo
3. **Build Command:** ទទេ (ឬ `echo ok`) · **Publish Directory:** `.`
4. ចុច **Create Static Site**

**វិធី B — Blueprint:** render.com → **New + → Blueprint** → ជ្រើស repo (វានឹងអាន `render.yaml` ស្វ័យប្រវត្តិ)

## តេស្តលើកុំព្យូទ័រ

```bash
python -m http.server 3000      # ឬ  npx serve .
# បើក http://localhost:3000
```
(កុំបើក index.html ដោយចុចពីរដង — វីដេអូ និង music ដំណើរការល្អជាងតាម server)

## ប្តូរពាក្យសម្ងាត់ Admin
Admin → **Security** → បញ្ចូលពាក្យសម្ងាត់ចាស់ + ថ្មី → Save។

## License
Free to use and modify.
