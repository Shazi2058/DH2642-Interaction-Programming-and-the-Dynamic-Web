# BEYOND — Universe Explorer

BEYOND is a website where you can explore space. You can fly around a 3D solar system, learn about the planets, look at real NASA pictures and save your favorites in your own collection called **My Universe**.

It is a school-style, educational project. It is not made by NASA and it is not connected to NASA.

---

## What can you do on BEYOND?

- **Explore** – A 3D solar system. Click a planet to fly to it. You can zoom and move around. There is a _Visual_ mode (looks nice) and a _Scale_ mode (closer to real sizes).
- **Grand Tour** – A guided trip past all eight planets, with a short story at each stop.
- **Planets** – A page for each of the 8 planets. You see a 3D planet, key numbers, fun facts, moons, rings and NASA pictures.
- **Compare** – Put two planets next to each other and see how they are different.
- **Discoveries** – The NASA _Astronomy Picture of the Day_ and a search for NASA images. You can filter by planets, galaxies, nebulae, stars and missions, and open any picture in full screen.
- **Search** – One search box for the whole site, with suggestions and a "Surprise me" button.
- **My Universe** – Your saved planets and images. You can add notes, earn points and unlock achievements.
- **Profile** – Sign in or out and change your settings.
- **Extra fun** – A daily quiz, a weight calculator ("how much would I weigh on Mars?"), a moons diagram and a close-up of Saturn's rings.

The site also works well on phones, can be used with a keyboard, and has a _reduced motion_ option for people who do not like a lot of movement.

---

## Built with

- **TypeScript** – JavaScript with types, so mistakes are found early
- **React** and **Vite** – the app and the dev tools
- **Redux Toolkit** – keeps the app's data in one place
- **React Router** – the different pages
- **Three.js** with **React Three Fiber** and **drei** – the 3D scene
- **Framer Motion** – smooth animations
- **Firebase** (Authentication and Firestore) – optional sign-in and saving online
- **NASA APIs** – real pictures and data

---

## How to run it

You need [Node.js](https://nodejs.org/) installed.

```bash
# 1. Install the packages
npm install

# 2. Start the site
npm run dev
```

Then open **http://localhost:5173** in your browser.

Other commands:

```bash
npm run build     # makes the final website in the "dist" folder
npm run preview   # lets you test the built website
```

### Two ways to use it

**1. Local mode (the easy way)**
You do not need to set up anything. Your saved items are kept in your own browser, and they stay in sync between browser tabs.

**2. Online mode (with Firebase)**
Use this if you want accounts and saving on many devices.

1. Open `./firebase.ts`.
2. Fill in your Firebase web app keys:
   ```ts
   apiKey: "apiKey",
   authDomain: "authDomain",
   projectId: "projectId",
   appId: "appId",
   ```
3. In the Firebase console, turn on **Email/Password** and **Google** sign-in.
4. Create a **Firestore** database.
5. Publish the rules from `firestore.rules`. These rules make sure each user can only read and write their own data.

Optional: add `VITE_NASA_API_KEY` if you have a NASA API key. If you leave it empty, the site uses `DEMO_KEY`.

> Never share your Firebase keys and never put them on a public GitHub page.

---

## Pages

| Page              | Address                                        |
| ----------------- | ---------------------------------------------- |
| Explore           | `/`                                            |
| All planets       | `/planets`                                     |
| One planet        | `/planets/:id` (for example `/planets/saturn`) |
| Compare           | `/compare`                                     |
| Discoveries       | `/discoveries`                                 |
| Search            | `/search`                                      |
| My Universe       | `/my-universe`                                 |
| Profile           | `/profile`                                     |
| About and credits | `/about`                                       |

---

## How the code is organized

The project uses the **MVP** idea: _Model – View – Presenter_. Each folder has one clear job. All code files are TypeScript (`.ts` and `.tsx`).

```
src/
├── app/           Routes and the main menu
├── views/         What each page looks like (no data logic)
├── components/    Small reusable pieces: the 3D scene, cards, buttons
├── presenters/    Connect the views to the data
├── model/         Redux store, slices and "thunks" (what happens on a click)
├── sources/       Talk to the NASA APIs
├── persistence/   Sign-in and saving (Firebase or the browser)
├── data/          Planets, moons, tour text and quiz questions
└── styles/        CSS files
```

A simple way to remember it:

- **View** = what it looks like
- **Presenter** = the wiring
- **Model** = what happens

Example: when you press **Save** on Saturn, the view calls `onSave()`, the presenter sends one action, and the model updates the state, gives you points, shows a message, saves the data and checks for new achievements.

Want to understand the code better? Read **`CODE_GUIDE.md`**. It has a reading order, simple explanations and likely questions.

### Where do I change things?

| I want to change…        | Look in                     |
| ------------------------ | --------------------------- |
| Planet facts and numbers | `src/data/planets.ts`       |
| Grand Tour text          | `src/data/tour.ts`          |
| Moons and rings          | `src/data/moons.ts`         |
| Quiz questions           | `src/data/quiz.ts`          |
| Colors and fonts         | `src/styles/global.css`     |
| Points and achievements  | `src/model/achievements.ts` |
| NASA requests            | `src/sources/`              |
| What happens on a click  | `src/model/thunks.ts`       |
| Pages and routes         | `src/app/routes.tsx`        |

---

## Data and credits

- [NASA Astronomy Picture of the Day](https://apod.nasa.gov/apod/lib/about_apod.html) – daily image. Some images belong to their photographers. The credit is shown with each image.
- [NASA Image and Video Library](https://images-api.nasa.gov/) – search results and planet pictures.
- [NASA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) – the base for the planet numbers.

Open-source tools used: TypeScript (Apache 2.0), React, Redux Toolkit, React Router, three.js, React Three Fiber, drei, Framer Motion (all MIT), the Firebase SDK (Apache 2.0), and the Space Grotesk and Inter fonts (SIL Open Font License).

---

## Good to know

- BEYOND is **not** affiliated with, endorsed by or sponsored by NASA.
- The planets in the 3D scene are **drawn by code**. They are illustrations, not photos.
- In _Visual_ mode, sizes and distances are **not to scale**.
- Numbers like the moon count can change when scientists confirm new discoveries.
- The **Exoplanet explorer** is not finished yet. It is planned for the future.
- The Astronomy Picture of the Day uses NASA's newer feed first. If it fails, the site tries the old NASA API and then a built-in backup picture.

---

## Ideas for the future

- Exoplanet explorer
- Shared collections with friends
