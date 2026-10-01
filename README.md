# Hockey Coach Whiteboard 🏒📋

A responsive, offline-ready hockey drill diagramming and whiteboard web application designed for hockey coaches to plan plays, explain systems, and demonstrate drills from any device (Desktop, iPad, iPhone, Android tablet) right at the rink.

![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-blue.svg)
![Offline Enabled](https://img.shields.io/badge/Offline-100%25-success.svg)

---

## 🌟 Key Features

- **Pro-Grade Rink Diagramming**: Full NHL-style offensive / defensive half-ice rink with accurate goal crease, trapezoid, faceoff circles, hash marks, dot marks, and customizable goal nets.
- **Defensive House Toggle**: Instant toggle for the defensive scoring house polygon with smart click-through and depth layering.
- **Complete Coaching Toolset**:
  - **Drawing**: Freehand pencil, straight arrows, pass lines (dashed), player skate routes (curved & wavy), and defensive zones.
  - **Tokens**: Team positions (`C`, `LW`, `RW`, `LD`, `RD`, `G`), numbered players, pucks, cones, tires, nets, and opponents (`X`, `X1`–`X5`).
  - **Manipulation**: Direct corner drag handles for resizing, color picker, line thickness, rotation, duplicate, and delete.
  - **Organization**: Bring to Front / Send to Back layering so tokens inside shapes never get trapped.
- **Drill Animation Engine**: Animate player skating paths, passes, and routes directly on the board.
- **Preloaded Drills**: D-Zone Coverage, 2-on-1 Rush, Forecheck 2-1-2, Breakout vs 1-2-2, Power Play Umbrella, and Net Front Battle.
- **Export & Share**: High-resolution PNG export for team playbooks and drill sheets.
- **100% Offline PWA (Progressive Web App)**: Works without an internet connection at cold arenas. Installable to the home screen on iPhone, iPad, and Android.

---

## 📱 Installing on iPad / iPhone / Android

### On iPad or iPhone (Safari):
1. Open your published GitHub Pages URL in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**. The app will launch in full screen just like a native app.

### On Android or Chrome OS:
1. Open the URL in **Google Chrome**.
2. Tap the three dots menu (⋮) in the top-right corner.
3. Tap **Install app** or **Add to Home screen**.

---

## �� Local Development

Run any static HTTP server in the repository directory:

```bash
# Python 3
python3 -m http.server 3030

# Or with Node.js npx
npx serve .
```

Open `http://localhost:3030` in your browser.
