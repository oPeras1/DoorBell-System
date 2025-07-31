# Step 1: Build static web app
FROM node:18 AS builder

WORKDIR /app

COPY . .
RUN npm install
RUN npx expo export --platform web

# Step 2: Serve it
FROM node:18 AS production

WORKDIR /app

RUN npm install -g serve

# ✅ Corrected path
COPY --from=builder /app/dist ./web-build

CMD ["serve", "-s", "web-build", "-l", "3000"]
