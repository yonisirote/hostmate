# Hostmate Backend API

Base URL: `/api`

## Auth

### `POST /auth/signup`
Create a new user.

**Body**
```json
{
  "username": "string",
  "name": "string",
  "password": "string"
}
```

**200 Response**
```json
{
  "username": "string",
  "name": "string"
}
```

**Notes**
- Returns `401` with `{ "message": "..." }` on validation/create errors.

### `POST /auth/login`
Login and receive an access token. Also sets a `refreshToken` cookie (httpOnly).

**Body**
```json
{
  "username": "string",
  "password": "string"
}
```

**200 Response**
```json
{
  "userID": "string",
  "username": "string",
  "name": "string",
  "accessToken": "string"
}
```

### `POST /auth/refresh`
Exchange the `refreshToken` cookie for a new access token.

**Cookies**
- `refreshToken`: required

**200 Response**
```json
{ "accessToken": "string" }
```

### `POST /auth/revoke`
Revoke the current refresh token (from cookie) and clear the cookie.

**204 Response**
No body.

## Authentication

Most endpoints require a Bearer JWT:

```
Authorization: Bearer <accessToken>
```

On auth failures, endpoints respond with `401`.

## Dishes

Dish categories: `main | side | dessert | other`

### `GET /dishes`
List dishes owned by the authenticated user.

**Auth**: Bearer token required.

**200 Response**
Array of dish objects.

### `POST /dishes`
Create a dish.

**Auth**: Bearer token required.

**Body**
```json
{
  "name": "string",
  "description": "string | null",
  "category": "main | side | dessert | other"
}
```

**200 Response**
Created dish object.

### `PUT /dishes/:dishId`
Update a dish.

**Auth**: Bearer token required.

**Body**
```json
{
  "name": "string",
  "description": "string | null",
  "category": "main | side | dessert | other"
}
```

**200 Response**
Updated dish object.

### `DELETE /dishes/:dishId`
Delete a dish.

**Auth**: Bearer token required.

**200 Response**
```json
{ "message": "Dish deleted successfully." }
```

## Guests

### `GET /guests`
List guests owned by the authenticated user.

**Auth**: Bearer token required.

**200 Response**
Array of guest objects.

### `POST /guests`
Create a guest.

**Auth**: Bearer token required.

**Body**
```json
{ "name": "string" }
```

**200 Response**
Created guest object.

### `PUT /guests/:guestId`
Rename a guest.

**Auth**: Bearer token required.

**Body**
```json
{ "name": "string" }
```

**200 Response**
Updated guest object.

### `DELETE /guests/:guestId`
Delete a guest.

**Auth**: Bearer token required.

**204 Response**
No body.

### `GET /guests/:guestId/dishes`
Get dishes + rankings for a guest (host view).

**Auth**: Bearer token required.

**200 Response**
Array returned by `getGuestDishes` query.

### `POST /guests/:guestId/dishes/:dishId`
Rank a dish for a guest (host view).

**Auth**: Bearer token required.

**Body**
```json
{ "rank": 1 }
```

**Constraints**
- `rank` must be a number between `1` and `3`.

**200 Response**
Rank record/object.

### `GET /guests/token/:rankToken`
Guest access (no Bearer token): fetch guest + dishes using a rank token.

**200 Response**
```json
{
  "guest": { "id": "string", "name": "string", "rankToken": "string", "userId": "string" },
  "dishes": [],
  "hostName": "string | null"
}
```

### `POST /guests/token/:rankToken/dishes/:dishId`
Guest access (no Bearer token): rank a dish using a rank token.

**Body**
```json
{ "rank": 1 }
```

**Constraints**
- `rank` must be a number between `1` and `3`.

**200 Response**
Rank record/object.

## Allergies

Allergy values:
`gluten | dairy | eggs | fish | shellfish | peanuts | tree-nuts | soy | sesame`

### `GET /allergies`
List supported allergy strings.

**200 Response**
```json
["gluten", "dairy", "eggs", "fish", "shellfish", "peanuts", "tree-nuts", "soy", "sesame"]
```

### `GET /allergies/guests/:guestId`
Get a guest’s allergies.

**Auth**: Bearer token required.

**200 Response**
Array of allergy strings.

### `PUT /allergies/guests/:guestId`
Set a guest’s allergies.

**Auth**: Bearer token required.

**Body**
```json
{ "allergies": ["gluten", "dairy"] }
```

**200 Response**
Array of de-duplicated allergy strings.

### `GET /allergies/dishes/:dishId`
Get a dish’s allergens.

**Auth**: Bearer token required.

**200 Response**
Array of allergy strings.

### `PUT /allergies/dishes/:dishId`
Set a dish’s allergens.

**Auth**: Bearer token required.

**Body**
```json
{ "allergies": ["sesame"] }
```

**200 Response**
Array of de-duplicated allergy strings.

## Meals

### `GET /meals`
List meals owned by the authenticated user.

**Auth**: Bearer token required.

**200 Response**
Array of meal objects.

### `POST /meals`
Create a meal.

**Auth**: Bearer token required.

**Body**
```json
{
  "date": "string",
  "name": "string",
  "description": "string | null"
}
```

**200 Response**
Created meal object.

### `PUT /meals/:mealId`
Update a meal.

**Auth**: Bearer token required.

**Body**
```json
{
  "date": "string",
  "name": "string",
  "description": "string | null"
}
```

**200 Response**
Updated meal object.

### `DELETE /meals/:mealId`
Delete a meal.

**Auth**: Bearer token required.

**200 Response**
```json
{ "message": "Meal deleted successfully." }
```

### `GET /meals/:mealId`
Get guests for a meal.

**Auth**: Bearer token required.

**200 Response**
Array of guests for the meal.

### `POST /meals/:mealId`
Add guests to a meal.

**Auth**: Bearer token required.

**Body**
```json
{ "guestIds": ["guest-id-1", "guest-id-2"] }
```

**200 Response**
Array of created `meal_guests` join records.

### `DELETE /meals/:mealId/guests/:guestId`
Remove a guest from a meal.

**Auth**: Bearer token required.

**200 Response**
The removed join record.

### `GET /meals/:mealId/menu?includeUnsafe=true|false`
Get the computed menu for a meal, based on rankings and allergies.

**Auth**: Bearer token required.

**Query**
- `includeUnsafe`: if `true`, includes dishes that may conflict with allergies

**200 Response**
```json
{
  "main": [],
  "side": [],
  "dessert": [],
  "other": []
}
```

## Errors

Errors are returned as JSON:

```json
{ "message": "..." }
```

- `4xx`: message is the explicit error
- `5xx`: message is always `"Internal server error"`
