# 🏛️ CivicPulse — Civic Issue Reporting & Management Platform

A web application that connects citizens with their local municipal administration. Citizens report civic issues, track them in real time, and receive updates — while region-specific admins review, assign, and resolve complaints through a dedicated dashboard.

Built entirely with **vanilla HTML, CSS, and JavaScript** — no frameworks, no backend, no dependencies.

---

## ✨ Features

### 👤 Civilian Side
- **Report Issues** — Submit complaints with title, category, priority, description, location, and photo evidence
- **Voice Input** — Speak your complaint in 6 Indian languages; auto-translated to English via MyMemory API
- **Location Detection** — GPS-based location detection or manual address entry with live zone preview
- **Track Complaints** — Real-time timeline and progress indicator for every complaint
- **Notifications** — Instant alerts when complaint is assigned, escalated, or resolved
- **Feedback** — Rate the resolution and leave a comment after an issue is closed

### 🛡️ Admin Side
- **Region-Based Login** — Each admin manages only their zone (North, South, East, West, Central)
- **Smart Routing** — Complaint IDs are auto-tagged by region (e.g. `CP-NORTH-1043`) based on the location text
- **Assign Departments** — Route complaints to Roads, Electricity, Parks, Sanitation, Water, or Housing departments
- **Complaint Actions** — Update status, set priority, escalate to critical, or reject with a reason
- **Notifications** — Every admin action instantly notifies the civilian
- **Analytics** — Complaints broken down by category, status, priority, and department
- **Department Load** — Visual workload tracker per department

---

## 🗂️ Project Structure

```
CivicPulse/
├── index.html       # Main entry point — civilian + admin screens
├── styles.css       # Civilian dashboard styles
├── script.js        # Civilian logic, shared data, region detection, voice input
├── admin.html       # Standalone admin reference (optional)
├── admin.css        # Admin dashboard styles
└── admin.js         # Admin dashboard logic
```

---

## 🚀 Getting Started

No installation required.

1. Clone or download the repository
2. Open `index.html` in **Chrome** or **Edge**
3. Select a role and log in

> ⚠️ Voice input requires Chrome or Edge and must be served over HTTP (not opened as a raw file). Use a local server:
> ```bash
> npx serve .
> ```

---

## 🔐 Test Credentials

### Civilian
| Email | Password |
|---|---|
| `jane@example.com` | `Jane@123` |
| `john@example.com` | `John@123` |

### Admin (select Admin role on login screen)
| Admin ID | Password | Zone |
|---|---|---|
| `ADMIN-NORTH-01` | `north123` | North |
| `ADMIN-SOUTH-01` | `south123` | South |
| `ADMIN-EAST-01` | `east123` | East |
| `ADMIN-WEST-01` | `west123` | West |
| `ADMIN-CENTRAL-01` | `central123` | Central |

### Authority
| ID | Password |
|---|---|
| `ROADS-AUTH-01` | `roads123` |
| `ELEC-AUTH-01` | `elec123` |

---

## 🧭 How Region Routing Works

When a civilian submits a complaint, the location text is scanned against a keyword map to detect the zone:

| Location typed | Detected Zone | Complaint ID |
|---|---|---|
| `Anna Nagar` | NORTH | `CP-NORTH-1043` |
| `Adyar, Velachery` | SOUTH | `CP-SOUTH-1044` |
| `T Nagar, Main Street` | CENTRAL | `CP-CENTRAL-1045` |

Each admin only sees complaints from their own zone. Unrecognised locations default to **CENTRAL**.

---

## 🎙️ Voice Input

Supported languages for voice input:

| Language | Code |
|---|---|
| English | `en-IN` |
| Hindi | `hi-IN` |
| Tamil | `ta-IN` |
| Telugu | `te-IN` |
| Kannada | `kn-IN` |
| Malayalam | `ml-IN` |

Non-English speech is automatically translated to English using the [MyMemory API](https://mymemory.translated.net/) before filling the form field.

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| HTML / CSS / JS | Core application — no frameworks |
| Web Speech API | Voice input and speech recognition |
| MyMemory API | Translation of regional languages to English |
| localStorage | All data persistence |
| Google Sign-In (simulated) | Civilian authentication flow |

---

## 📸 Screenshots

> Login → Select role → Enter credentials → Dashboard

| Civilian Dashboard | Admin Dashboard |
|---|---|
| Report, track and get notified | Assign, escalate and resolve |

---

## 🗺️ Roadmap

- [ ] Department Authority dashboard
- [ ] Resolution confirmation flow (civilian confirms or disputes)
- [ ] Real backend integration (Node.js / Firebase)
- [ ] Real Google OAuth
- [ ] Mobile responsive layout
- [ ] Email notifications

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

> Built as a civic tech prototype to demonstrate how local issue reporting can be streamlined with smart routing and role-based access.
