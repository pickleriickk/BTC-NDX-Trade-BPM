# BTC-NDX-Trade-BPM

This project implements a trading dashboard for BTC and NDX assets by visualizing and trading signals, buy and sell actions. Below is an explanation of the client and backend architecture:

## Client-Side Framework

The client is built using **React.js**. Key components include:

### Core Libraries

- **React.js**: The foundation for building the UI components.
- **Chart.js**: Powers the data visualization.

### Dashboard Architecture

- **DashboardChart Component**: The main chart component that displays:
  - Asset price data (BTC/NDX).
  - USD/BTC/NDX Balance information.
  - Trading signals and actions.
  - Time-based navigation controls.

### State Management

Uses React's built-in `useState` hooks for local state management. Key state variables include:

- `userData`: Contains all trading data including prices, signals, and actions.
- `selectedInstance`: The current business process model instance being viewed.
- `timeWindow`: Controls the time range displayed (15min to 12hr).
- `visibleRange`: Controls the currently visible portion of the chart.
- `lastFetchTime`: Tracks when data was last fetched for polling.

### Data Handling

- **Initial Data Load**: Fetches all historical data on component mount.
- **Polling Mechanism**: Regularly polls for new data (every 30 seconds).
- **Data Merging**: New data is merged with existing data.
- **Time-Based Filtering**: Data is filtered based on the selected time window.

## Backend Framework

The backend is a REST API implemented with Node.js and Express.

### API Endpoints

**Base URL**: `https://lehre.bpm.in.tum.de/ports/14533`

#### BPM Endpoints

- **POST /**: Handles incoming events.
- **POST /login**: Validates and processes user login or registration.
- **GET /user-info**: Retrieves balance, signals, and current BTC or NDX amounts of the user (called on init).
- **GET /balance**: Retrieves account balance.
- **GET /advice**: Retrieves trading advice.
- **POST /buy**: Processes buy order for BTC or NDX.
- **POST /sell**: Processes sell order for BTC or NDX.
- **GET /price**: Retrieves the latest price information for BTC and NDX.

#### Dashboard Endpoints

- **GET /dashboard/data/poll?lastFetchTime={timestamp}**: Returns only new event data since the last fetch time.
- **GET /dashboard/**: Serves the static files for the client-side dashboard application.

### Data Model

The data is structured hierarchically:

- **Top Level**: Instances (identified by instance keys).
- **Instance Level**: Data fields including:

  - `btcPrice`: Bitcoin price time series.
  - `ndxPrice`: NDX price time series.
  - `balance`: Account balance.
  - `unrealizedBalance`: Unrealized gains/losses.
  - `btcAmount`, `ndxAmount`: Holdings of each asset.
  - `btcSignal`, `btcAction`: Trading signals and actions.

- **Time-Series Level**: Each data point includes:
  - `time`: Timestamp in milliseconds.
  - `value`: The corresponding value at that time.

### Technical Challenges Addressed

- **Real-time Updates**: Implemented through polling.
- **Visual Mapping**: Trading signals and actions are visually aligned with price data.
- **Time-Based Navigation**: Users can scroll through historical data.
- **Responsive Design**: Chart adapts to different time windows.

## Running Instructions

### 1. Create .env file

- Put given .env file with corresponding COIN_MARKET_CAP_API_KEY and MODEL_UUID to the main folder.

### 2. Build Dashboard Client

```sh
cd client # Navigate to client folder
npm i # Install libraries
npm run build # Build public files
cd .. ## Navigate to main folder
```

### 3. Build and start backend

```sh
npm i
npm start
```

### 4. Start the Business Process Model

- Navigate to the
  `https://{TUM_BPM_PREFIX}/TUM-Prak-24-WS.dir/Koray%20Cetin.dir`
  and start a new **BTC_NDX Trader** process model.

### 5. See the events in the dashboard.

- Navigate to the [dashboard url](https://lehre.bpm.in.tum.de/ports/14533/dashboard/).
- Select your process model instance id from the top dropdown menu.
- Feel free to select time windows _eg. 15min, 1hr..._ and different charts _eg. Price, Balance, Amount_.
- Also iterate through previous/next time intervals, using the arrow buttons on each side of the screen.
- In each chart you can toggle on/off a component. For example you can only select NDX price or BTC Price etc.

- Below is an example visualization chart:
  ![Example Chart](fig/example_chart.png)
