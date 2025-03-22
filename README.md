# Doorbell System

## Overview
The **Doorbell System** is a smart, connected solution integrating an Android application with a backend service to manage a doorbell and door access system. The system utilizes Kotlin for the Android application, Java with Spring Boot for the backend, and MariaDB as the database running in a Docker container. Additionally, the backend communicates with an Arduino to control doorbell functions.

## Features (In construction)
- **User Authentication**: Login and logout functionality.
- **Admin Account**: Manage user roles and permissions.
- **Remote Door Control**: Open the door via the mobile application.
- **Bell Mute Functionality**: Temporarily disable the doorbell.
- **Command Logging**: Maintain records of all user actions.

## Technology Stack
### Frontend (Android Application)
- **Language**: Kotlin
- **Build System**: Gradle

### Backend
- **Language**: Java (Spring Boot)
- **Build System**: Gradle
- **Database**: MariaDB (Dockerized)
- **API Communication**: REST API

### Hardware
- **Arduino**: Manages doorbell and door lock control
- **Communication**: Serial or IoT protocols

### Deployment
- **NixOS**: Deployment configurations managed with Flake.nix

## Installation and Setup
### Prerequisites
Ensure the following dependencies are installed:
- Android Studio (for the mobile application)
- Java 17+ (for the backend service)
- Docker & Docker Compose (for database management)
- Arduino IDE (for hardware programming)
- Nix Package Manager (for deployment on NixOS)

### Setup Instructions
#### 1. Clone the Repository
```bash
git clone https://github.com/oPeras1/DoorBell-System.git
cd Doorbell-System
```

#### 2. Start the Backend Service
```bash
cd backend
./gradlew bootRun
```

#### 3. Start the Database Service
```bash
cd database
docker-compose up -d
```

#### 4. Run the Android Application
Open the `android` folder in Android Studio and launch the application on a device or emulator.

#### 5. Deploy on NixOS (Optional)
```bash
nix develop
```

## API Endpoints
| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| POST   | `/api/auth/login`      | User authentication |
| POST   | `/api/auth/logout`     | User logout         |
| POST   | `/api/admin/open-door` | Open the door       |
| POST   | `/api/admin/mute-bell` | Mute the doorbell   |
| GET    | `/api/logs`            | Retrieve command logs |

## Contributing
Contributions are welcome. Follow these steps to contribute:
1. Fork the repository.
2. Create a new branch (`feature-xyz`).
3. Commit changes.
4. Submit a pull request for review.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

