# Insurance Policy Management System

A Node.js, Express.js, and MongoDB-based Insurance Policy Management API that supports bulk Excel/CSV imports, policy searching, user-wise policy aggregation, scheduled messaging, and CPU monitoring.

## Features

- **Bulk Data Import:** Upload Excel and CSV files using Multer and process records through Node.js Worker Threads.
- **MongoDB Integration:** Store insurance agents, users, accounts, policy categories, carriers, and policies in separate collections.
- **Policy Search:** Search insurance policies using a username.
- **Policy Aggregation:** Retrieve policies grouped by individual users using MongoDB aggregation and `$lookup`.
- **Scheduled Messaging:** Schedule messages for a specific date and time and automatically process them using node-cron.
- **CPU Monitoring:** Monitor CPU utilization using systeminformation and exit the application when CPU usage reaches 70%.
- **Process Management:** Use PM2 to automatically restart the application after an unexpected exit.
- **API Documentation:** Interactive Swagger UI documentation.

## Tech Stack

- Javascript
- Node.js
- Express.js
- MongoDB
- Mongoose
- Worker Threads
- Multer
- XLSX
- CSV Parser
- node-cron
- systeminformation
- Swagger UI
- PM2

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
├── app.js
├── server.js
├── .env
├── .gitignore
└── package.json
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
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
```

Make sure MongoDB is installed and running.

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
| GET | `/api/policies/search/:username` | Search policies by username |
| GET | `/api/policies/users/summary` | Aggregate policies by user |
| POST | `/api/posts/schedule` | Schedule a message |

## Bulk Data Import

Upload an Excel (`.xlsx`) or CSV file through the Swagger UI.

The upload endpoint processes records using Worker Threads and stores the data in the following collections:

1. Agents
2. Users
3. Accounts
4. LOBs (Policy Categories)
5. Carriers
6. Policies

The uploaded file should contain the required column headers corresponding to the import mapping implemented in the worker.

## Scheduled Messaging

The scheduling API accepts:

- `message`: Message content.
- `day`: Scheduled date in `YYYY-MM-DD` format.
- `time`: Scheduled time in `HH:mm` format.

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

The application monitors CPU utilization periodically.

When CPU usage reaches 70%, the application exits with a non-zero exit code. PM2 is configured to restart the application automatically.

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

Database name: `insurance_db`

The application uses Mongoose to manage MongoDB schemas, relationships, and queries.

## License

This project was developed as a technical assessment for an Insurance Policy Management System.
