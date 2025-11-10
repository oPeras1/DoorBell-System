# Use OpenJDK 17 as base image
FROM eclipse-temurin:17-jdk as build

# Set working directory
WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradlew.bat .
COPY gradle/ ./gradle/
COPY settings.gradle .
COPY gradle.properties .

# Copy app build file and source code
COPY app/build.gradle ./app/
COPY app/src/ ./app/src/

# Make gradlew executable
RUN chmod +x ./gradlew

# Build the application
RUN ./gradlew build --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jdk

# Set working directory
WORKDIR /app

# Copy the built jar from build stage
COPY --from=build /app/app/build/libs/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
