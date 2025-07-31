# Doorbell System

## Overview
The **Doorbell System** is a smart, connected solution integrating a cross-platform mobile application and web interface with a backend service to manage a doorbell and door access system. The system utilizes React Native for cross-platform mobile and web deployment, Java with Spring Boot for the backend, MariaDB as the database, and an ESP32 microcontroller to interface with the physical doorbell hardware.

## Features (In construction)
- **Cross-Platform Access**: Mobile apps (Android/iOS) and web interface
- **User Authentication**: Login and logout functionality
- **Admin Account**: Manage user roles and permissions
- **Remote Door Control**: Open the door via the application
- **Bell Mute Functionality**: Temporarily disable the doorbell
- **Command Logging**: Maintain records of all user actions
- **Real-time Hardware Control**: Direct communication with physical doorbell system

## Technology Stack

### Frontend
- **Framework**: React Native
- **Platforms**: Web, Android, iOS
- **Build System**: Metro bundler

### Backend
- **Language**: Java (Spring Boot)
- **Build System**: Gradle
- **Database**: MariaDB (Dockerized)
- **API Communication**: REST API

### Hardware
- **Microcontroller**: ESP32
- **Physical Integration**: Urmet CS 1133-881c doorbell with relay control
- **Connectivity**: Ethernet connection to backend
- **Components**: Relays and control circuits

### Infrastructure
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Deployment**: Automated deployment pipeline

## Installation and Setup

### Prerequisites
Ensure the following dependencies are installed:
- Node.js and npm/yarn (for React Native application)
- Java 17+ (for the backend service)
- Docker & Docker Compose (for database and deployment)
- React Native development environment
- ESP32 development tools

### Setup Instructions

#### 1. Clone the Repository
```bash
git clone https://github.com/oPeras1/DoorBell-System.git
cd Doorbell-System
```

#### 2. Start the Database Service
```bash
cd database
docker-compose up -d
```

#### 3. Start the Backend Service
```bash
cd backend
./gradlew bootRun
```

#### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
# or
yarn install
```

#### 5. Run the Applications

**Web Application:**
```bash
npm start
# or
yarn start
```

**Android Application:**
```bash
npm run android
# or
yarn android
```

**iOS Application:**
```bash
npm run ios
# or
yarn ios
```

#### 6. ESP32 Setup
Configure and flash the ESP32 with the appropriate firmware to communicate with the backend and control the Urmet CS 1133-881c doorbell system.

## API Endpoints

| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| POST   | `/api/auth/login`      | User authentication |
| POST   | `/api/auth/logout`     | User logout         |
| POST   | `/api/admin/open-door` | Open the door       |
| POST   | `/api/admin/mute-bell` | Mute the doorbell   |
| GET    | `/api/logs`            | Retrieve command logs |

## Deployment

The system uses Docker containers and GitHub Actions for automated CI/CD deployment. The deployment includes:
- Backend service containerization
- Database (MariaDB) containerization
- Frontend build and deployment
- Automated testing and deployment pipeline

## Hardware Integration

The ESP32 microcontroller interfaces directly with the Urmet CS 1133-881c doorbell system through:
- Relay control circuits for door opening mechanism
- Bell mute functionality through hardware switches
- Ethernet connectivity for reliable backend communication
- Real-time status monitoring and control

## Contributing

Contributions are welcome. Follow these steps to contribute:
1. Fork the repository
2. Create a new branch (`feature-xyz`)
3. Commit changes with clear descriptions
4. Submit a pull request for review

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
