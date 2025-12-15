# Task Management API

A robust, production-ready RESTful API designed for modern task management applications. Built with performance, security, and scalability in mind.

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

## Features

- **Advanced Authentication**: Secure user registration and login using JWT (Access & Refresh token rotation).
- **Task Management**: Full CRUD operations for tasks with rich metadata (priority, status, due dates).
- **Smart Categorization**: Organize tasks with custom, color-coded categories.
- **Powerful Filtering**: Filter by status, priority, category, and text search.
- **Performance**: Implemented pagination, sorting, and database indexing for speed.
- **Security First**: Armed with Helmet, CORS, Rate Limiting, and Data Sanitization.
- **Collaboration**: Share tasks with other users for team workflows.

## Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Runtime** | Node.js | Asynchronous event-driven JavaScript runtime |
| **Framework** | Express.js | Fast, unopinionated web framework |
| **Database** | MongoDB | NoSQL database for flexible data schemas |
| **ODM** | Mongoose | Elegant MongoDB object modeling |
| **Auth** | JWT | Stateless authentication mechanism |

## Quick Start

### Prerequisites

- **Node.js** (v16+)
- **MongoDB** (Local or AtlasURI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ThePremkumar/Task-Management-API
   cd task-management-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/taskmanager
   JWT_SECRET=your_secret_key
   JWT_EXPIRE=1h
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_REFRESH_EXPIRE=7d
   ```

4. **Run the Server**
   ```bash
   npm run dev
   ```

## API Testing Guide

The API runs at `http://localhost:5000`. Below are example requests you can import into Postman or use with cURL.

**Note:** All endpoints (except Register/Login) require the Authorization header:
`Authorization: Bearer <your_access_token>`

### 1. Authentication

**Register User**
`POST /api/auth/register`
```json
{
  "username": "prem",
  "email": "prem@gmail.com",
  "password": "Password123"
}
```

**Login**
`POST /api/auth/login`
```json
{
  "email": "prem@gmail.com",
  "password": "Password123"
}
```
*Copy the `accessToken` from the response for subsequent requests.*

### 2. Task Operations

**Create a Task**
`POST /api/tasks`
```json
{
  "title": "Complete Backend API",
  "description": "Implement authentication and task CRUD operations",
  "priority": "high",
  "estimatedHours": 4,
  "dueDate": "2025-12-31",
  "tags": ["coding", "backend"]
}
```

**Get All Tasks (with Filters)**
`GET /api/tasks?status=todo,in-progress&priority=high&sort=createdAt:desc`

**Get Single Task**
`GET /api/tasks/<task_id>`

**Update Task**
`PUT /api/tasks/<task_id>`
```json
{
  "title": "Complete Backend API V2",
  "status": "in-progress",
  "estimatedHours": 6
}
```

**Update Task Status (Quick)**
`PUT /api/tasks/<task_id>/status`
```json
{
  "status": "completed"
}
```

**Delete Task**
`DELETE /api/tasks/<task_id>`

### 3. Category Operations

**Create Category**
`POST /api/categories`
```json
{
  "name": "Work",
  "color": "#3B82F6"
}
```

**Get Categories**
`GET /api/categories`

## Project Structure

```bash
src/
├── config/         # Database connection
├── controllers/    # Request logic
├── middleware/     # Auth & Error handling
├── models/         # Mongoose schemas
├── routes/         # API routes
└── utils/          # Helpers
```

## License

This project is licensed under the MIT License.
