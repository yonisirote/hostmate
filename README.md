[![CI Tests](https://github.com/yonisirote/hostmate/actions/workflows/tests.yml/badge.svg)](https://github.com/yonisirote/hostmate/actions/workflows/tests.yml)

# 🍽️ HostMate

**HostMate** is a web application designed to assist hosts in organizing meals. It facilitates the uploading and management of dishes and guests, enables the collection of guest preferences by sending guests ranking links, and generates personalized menus for each meal tailored to individual guest tastes.

---
## 🔗 Live Link

Start planning your next gathering! [HostMate](https://hostmate.up.railway.app/)

---

## 🎥 Demo

![HostMate demo](./assets/demo.gif)

---

## 📖 Usage

1. **Create an account**  
2. **Upload your repertoire of dishes**  
3. **Upload a guest list**  
4. **Send guests links to rank their dish preferences**
5. **Create a meal, invite guests, and receive a personalized menu recommendation**

---

## 🛠 Technologies Used

- **Frontend:** React.js, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **Database:** Turso (SQLite), Drizzle ORM 
- **Authentication:** JWT Refresh and Access tokens
- **Deployment:** [Railway](https://railway.com/)

---

## 🚧 Coming soon

- Allergies (guests & dishes)
	- Allow tagging allergies on guest profiles and ingredients/allergens on dishes.
	- Meal recommendations will, by default, exclude dishes that contain any of a guest's recorded allergeis (with per-meal overrides for hosts).

- Ingredients & shopping list
	- Store ingredients for each dish and generate an aggregated shopping list from a meal's recommended menu.
	- Shopping lists will account for guest counts and servings, and can be exported or printed.

- Custom categories & subcategories for dishes
	- Let hosts organize dishes into categories (e.g., "Breakfast", "Dinner") and subcategories (e.g., "Dairy", "Pastries").

- Guest groups
	- Create groups of guests (family, friends, coworkers) to invite and manage collectively.
	- Group-level invitations, shared preferences, and quick filters in the UI.
