# Insurance Policy Management System

A Node.js, Express.js, and MongoDB-based Insurance Policy Management API developed as a technical assessment. It supports bulk Excel/CSV imports, policy searching, user-wise policy aggregation, scheduled messaging, and CPU monitoring.

## Live Deployment

- **Live API:** https://insurance-policy-management-d6no.onrender.com
- **Swagger API Documentation:** https://insurance-policy-management-d6no.onrender.com/api-docs
- **GitHub Repository:** https://github.com/Uttaran27/insurance-policy-management

The application is deployed on Render and connected to MongoDB Atlas.

> Note: The free Render instance may spin down after inactivity. The first request after inactivity can take around 50 seconds or more to respond.

## Features

- **Bulk Data Import:** Upload Excel and CSV files using Multer and process records through Node.js Worker Threads.
- **MongoDB Integration:** Store insurance agents, users, accounts, policy categories, carriers, and policies in separate collections.
- **Policy Search:** Search insurance policies using a username.
- **Policy Aggregation:** Retrieve policies grouped by individual users using MongoDB aggregation and `$lookup`.
- **Scheduled Messaging:** Schedule messages for a specific date and time and automatically process them using node-cron.
- **CPU Monitoring:** Monitor CPU utilization using systeminformation and exit the application when CPU usage reaches 70%.
- **Process Management:** Use PM2 to automatically restart the application after an unexpected exit in a local/self-managed environment.
- **API Documentation:** Interactive Swagger UI documentation.
- **Cloud Deployment:** Hosted on Render with MongoDB Atlas as the cloud database.

## Tech Stack

- JavaScript
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Worker Threads
- Multer
- XLSX
- CSV Parser
- node-cron
- systeminformation
- Swagger UI
- PM2
- Render

## Project Structure

```text
insurance-policy-management/
├── config/
│   ├── db.js
│   └── swagger.js
├── controllers/
│   ├── uploadController.js
│   ├── policyController.js
│   └── postController.js
├── models/
│   ├── Agent.js
│   ├── User.js
│   ├── Account.js
│   ├── LOB.js
│   ├── Carrier.js
│   ├── Policy.js
│   ├── ScheduledPost.js
│   └── Message.js
├── routes/
│   ├── uploadRoutes.js
│   ├── policyRoutes.js
│   └── postRoutes.js
├── workers/
│   └── importWorker.js
├── services/
│   ├── cpuMonitor.js
│   └── scheduler.js
├── uploads/
├── sample-data/
├── app.js
├── server.js
├── migrateToAtlas.js
├── .env
├── .gitignore
└── package.json
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Uttaran27/insurance-policy-management.git
cd insurance-policy-management
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/insurance_db
NODE_ENV=development
API_KEY=replace-with-a-long-random-string
CORS_ORIGINS=http://localhost:5000
ENABLE_CPU_RESTART=false
```

`API_KEY` is required. Send it on every `/api` request as the `x-api-key` header. Requests without a matching key are rejected.

`CORS_ORIGINS` is a comma-separated list of extra browser origins allowed to call the API. Requests with no `Origin` header (curl, server-side clients) are allowed. The host that is serving the API is allowed too, so Swagger on that same host keeps working. `http://localhost:5000` and `http://127.0.0.1:5000` are always allowed.

`ENABLE_CPU_RESTART=true` exits the process when system CPU reaches 70%. Leave it unset on Render. Under PM2 the exit is enabled automatically, and an in-flight import is not interrupted.

For cloud deployment, configure `MONGO_URI`, `API_KEY`, and `CORS_ORIGINS` in the host's environment settings.

Never commit your `.env` file or expose database credentials or the API key.

### 4. Start the application

```bash
node server.js
```

The application will run at:

`http://localhost:5000`

### 5. Access Swagger documentation

`http://localhost:5000/api-docs`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload Excel/CSV data |
| GET | `/api/policies/search/:username` | Search policies by exact username (`page`, `limit`) |
| GET | `/api/policies/users/summary` | Aggregate policies by user (`page`, `limit`) |
| POST | `/api/posts/schedule` | Schedule a message for an IST date and time |

All `/api` routes require the `x-api-key` header. `page` defaults to 1 and `limit` defaults to 20, with a maximum of 100.

## Testing the Live Application

Open the deployed Swagger documentation:

https://insurance-policy-management-d6no.onrender.com/api-docs

You can test the following endpoints:

1. **Policy Search:** Use `GET /api/policies/search/rohan.sharma` to retrieve that exact username and the user's associated policies. Add the `x-api-key` header.
2. **User Policy Summary:** Use `GET /api/policies/users/summary` to retrieve users and their policy counts.
3. **Excel/CSV Upload:** Use `POST /api/upload` to upload an Excel or CSV file.
4. **Scheduled Messaging:** Use `POST /api/posts/schedule` to schedule a message for a particular date and time.

These endpoints interact with the deployed MongoDB Atlas database.

## Bulk Data Import

Upload an Excel (`.xlsx`) or CSV file through the Swagger UI.

The upload endpoint processes records using Worker Threads and stores the data in the following primary collections:

1. Agents
2. Users
3. Accounts
4. LOBs (Policy Categories)
5. Carriers
6. Policies

The uploaded file should contain the required column headers corresponding to the import mapping implemented in the worker.

A sample Excel file is available in the `sample-data/` directory.

## Scheduled Messaging

The scheduling API accepts:

- `message`: Message content.
- `day`: Scheduled date in `YYYY-MM-DD` format, interpreted in IST (UTC+05:30).
- `time`: Scheduled time in `HH:mm` format, interpreted in IST (UTC+05:30).

Example request:

```json
{
  "message": "Scheduled insurance notification",
  "day": "2026-11-15",
  "time": "14:30"
}
```

Scheduled messages are stored in MongoDB and processed automatically. Successfully executed messages are inserted into the `messages` collection, and their scheduled post status is updated to `completed`.

## CPU Monitoring and PM2

The application monitors CPU utilization only when PM2 is the process manager, or when `ENABLE_CPU_RESTART=true`.

When that mode is on and CPU usage reaches 70%, the application exits with a non-zero exit code so PM2 can restart it. The process stays up while a file import is running, so a spreadsheet parse does not kill itself. On Render, leave `ENABLE_CPU_RESTART` unset. Render is not PM2, and exiting there only crashes the service.

Start using PM2:

```bash
pm2 start server.js --name insurance-api --restart-delay 3000
```

Check application status:

```bash
pm2 list
```

View logs:

```bash
pm2 logs insurance-api
```

Save the PM2 process list:

```bash
pm2 save
```

## Database

- **Database:** `insurance_db`
- **Database Technology:** MongoDB
- **Local Development:** MongoDB Community Server
- **Production:** MongoDB Atlas

The database contains the six primary insurance collections along with two additional collections used for scheduled messaging:

- `agents`
- `users`
- `accounts`
- `lobs`
- `carriers`
- `policies`
- `scheduledposts`
- `messages`

Mongoose manages database schemas, relationships, and queries.

The deployed APIs can be used to verify database connectivity and retrieve stored records. Direct database access is not publicly exposed; separate read-only access can be provided if required.

## Deployment

The application is deployed using Render as a Node.js Web Service and uses MongoDB Atlas for cloud database storage.

- **Hosting:** Render
- **Database Hosting:** MongoDB Atlas
- **Deployment Branch:** `main`

## License

This project was developed as a technical assessment for an Insurance Policy Management System.