# Build stage: tests are skipped here because they need Docker (Testcontainers); run ./mvnw test before deploying.
FROM eclipse-temurin:17-jdk AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -q dependency:go-offline
COPY src src
RUN ./mvnw -q package -DskipTests && cp target/*.jar app.jar

FROM eclipse-temurin:17-jre
RUN useradd --system --create-home piocart
WORKDIR /app
COPY --from=build /src/app.jar app.jar
USER piocart
EXPOSE 9191
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
