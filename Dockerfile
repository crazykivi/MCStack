FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o mcstack ./cmd/mcstack

FROM alpine:latest
RUN apk --no-cache add openjdk17-jre
WORKDIR /app
COPY --from=builder /app/mcstack .
COPY --from=builder /app/config.example.json ./config.json
EXPOSE 8080
CMD ["./mcstack"]