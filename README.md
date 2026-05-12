# Frontend ke hisaab se Backend API Contract (Reference)

> Note: Aapne bola hai ki backend yahan nahi banana, sirf API contract chahiye.  
> Is file me wahi diya gaya hai jo current frontend + business flow ke liye required hai.

## Implemented API modules (current code)

Backend is now split into **models + controllers + routes** and supports separate APIs for landing page entities.

### Separate APIs for landing content
- `GET /api/branding`, `PUT /api/branding` (admin)
- `GET /api/banners`, `POST /api/banners` (admin)
- `GET /api/service-categories`, `POST /api/service-categories` (admin)
- `GET /api/stats`, `POST /api/stats` (admin)
- `GET /api/testimonials`, `POST /api/testimonials` (admin)
- `GET /api/users` (admin)
- Existing aggregate: `GET /api/landing-data`

### Folder structure
- `models/` -> data layer for db.json
- `controllers/` -> business logic
- `routes/` -> route mapping
- `utils/` -> shared db/auth/http helpers

---

## 1) Base rules (common for all APIs)

- **Base URL**: `https://<your-domain>`
- **API Prefix**: `/api`
- **Content-Type**: `application/json`
- **Auth header** (protected routes):  
  `Authorization: Bearer <token>`
- **Time format**: ISO datetime (`2026-03-23T09:00:00.000Z`)
- **Currency format**: UI currently text format use karta hai (e.g. `₹50,000 - ₹75,000`)

### Standard response format (recommended)

```json
{
  "success": true,
  "message": "optional human message",
  "data": {}
}
```

Error format:

```json
{
  "success": false,
  "message": "validation or auth error",
  "errors": [
    { "field": "title", "message": "title is required" }
  ]
}
```

---

## 2) Frontend ko render karne ke liye required data

Landing page ko dynamic banane ke liye frontend ko ek aggregated API chahiye:

## `GET /api/landing-data`

### Purpose
- Pura landing page data ek call me aa jaye:
  - branding
  - banners
  - service categories
  - tenders
  - stats
  - testimonials
  - how-it-works

### Response keys (required)

```json
{
  "branding": {
    "name": "TenderHub",
    "tagline": "From Foundation to Furniture",
    "logoUrl": "https://.../logo.png"
  },
  "banners": [
    {
      "title": "Find Trusted Service Providers",
      "subtitle": "Electricians, Plumbers, Carpenters & More",
      "description": "Connect with verified professionals for all your service needs",
      "image": "https://..."
    }
  ],
  "serviceCategories": [
    {
      "category": "Home Services",
      "icon": "🏠",
      "services": [
        {
          "name": "Electrician",
          "emoji": "⚡",
          "desc": "Wiring, repairs, installations",
          "price": "₹500/hr",
          "popular": true
        }
      ]
    }
  ],
  "tenders": [
    {
      "id": "uuid-or-string",
      "title": "Office Electrical Work",
      "location": "Mumbai",
      "status": "open",
      "budget": "₹25,000 - ₹35,000",
      "deadline": "3 days left",
      "category": "Home Services",
      "client": "Tech Corp India",
      "visibility": "public"
    }
  ],
  "stats": [
    { "number": "10,000+", "label": "Services Completed", "emoji": "✅" }
  ],
  "testimonials": [
    {
      "name": "Rajesh Kumar",
      "role": "School Principal",
      "rating": 5,
      "text": "..."
    }
  ],
  "howItWorks": [
    {
      "step": "01",
      "title": "Post Your Requirement",
      "desc": "...",
      "emoji": "📝",
      "color": "#1a3e4c"
    }
  ]
}
```

### Conditions / validation
- `banners.length >= 1` (warna hero section break hoga)
- `serviceCategories[].services.length >= 1`
- `rating` range: `1..5`
- `tenders[].status` allowed: `open | booked | closed`
- `visibility` allowed: `public | admin-only`

---

## 3) Auth & role system (business requirement ke hisaab se)

Roles:
- `admin` (fixed ID / fixed account)
- `user` (requirement post karega)
- `vendor` (tenders dekhega + quote submit karega)

## `POST /api/auth/register`

### Body
```json
{
  "name": "Aman Singh",
  "email": "aman@example.com",
  "password": "strongPassword",
  "role": "user"
}
```

### Conditions
- required: `name`, `email`, `password`
- allowed role at register time: `user | vendor`
- `admin` register API se create na ho (fixed rehna chahiye)
- email unique hona chahiye
- password min length recommend: `8`

---

## `POST /api/auth/login`

### Body
```json
{
  "email": "admin@tenderhub.local",
  "password": "admin@123"
}
```

### Success response
```json
{
  "token": "jwt-or-session-token",
  "user": {
    "id": "user-id",
    "name": "Platform Admin",
    "email": "admin@tenderhub.local",
    "role": "admin"
  }
}
```

### Conditions
- invalid credentials => `401`
- token expiry recommend: `7d` (or your policy)

---

## 4) Tender APIs

## `GET /api/tenders`

### Query params (optional)
- `status=open|booked|closed`
- `category=<string>`
- `page=<number>`
- `limit=<number>`

### Conditions
- default sort: newest first
- sirf `visibility=public` records return kare for public routes

---

## `POST /api/tenders`

### Auth
- required (`user` or `admin`)

### Body
```json
{
  "title": "Need electrician for office",
  "category": "Home Services",
  "location": "Noida",
  "budget": "₹15,000 - ₹25,000",
  "deadline": "5 days left",
  "client": "ABC Pvt Ltd"
}
```

### Conditions
- required: `title`, `category`, `location`, `budget`, `deadline`
- if role = `user` => store as `visibility = admin-only` (as per your requirement)
- if role = `admin` => can be `visibility = public`
- default `status = open`

---

## `POST /api/tenders/:id/quotes`

### Auth
- required (`vendor` only)

### Body
```json
{
  "amount": "₹22,000",
  "notes": "Can complete in 2 days"
}
```

### Conditions
- tender should exist
- tender status must be `open`
- `amount` required
- same vendor same tender pe duplicate quote policy define karo (allow/deny)

---

## 5) Admin-only APIs

## `GET /api/admin/requirements`
- user ke posted requirements (`visibility=admin-only`) list karega
- **role required**: `admin`

## `GET /api/admin/quotes`
- sab vendor quotes list karega
- **role required**: `admin`

## `POST /api/admin/assets`

### Body
```json
{
  "title": "CCTV Cameras",
  "description": "Need 20 units for new site",
  "quantity": "20",
  "requiredBy": "2026-04-10"
}
```

### Conditions
- required: `title`, `description`
- **role required**: `admin`

## `GET /api/admin/assets`
- admin ke asset requirements list
- **role required**: `admin`

---

## 6) Status/error codes mapping (recommended)

- `200` success (read/update)
- `201` created
- `400` validation fail
- `401` unauthenticated
- `403` unauthorized role
- `404` not found
- `409` conflict (duplicate email etc.)
- `500` server error

---

## 7) Frontend compatibility checklist

Backend new repo me banate waqt ensure:

- [ ] `GET /api/landing-data` exact keys ke saath aaye
- [ ] `tenders[].status` + `visibility` enums match kare
- [ ] login response me `token` + `user.role` aaye
- [ ] protected routes bearer token validate kare
- [ ] admin-only endpoints role guard kare
- [ ] CORS configured ho (frontend domain allow)
- [ ] API errors consistent format me ho

---

## 8) Minimum seed data jo zaruri hai

- 1 fixed admin account
- 4+ banners
- 4 service categories with services
- 4+ open tenders
- stats/testimonials/howItWorks arrays

Yeh sab hone par frontend "same to same" UI ke saath dynamic mode me chalega.
# vishwakarmaBuildAndFurnishBackend
