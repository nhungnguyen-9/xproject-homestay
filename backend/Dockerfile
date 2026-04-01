# Sử dụng Node.js image chính thức
FROM node:20-alpine AS builder

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Build dự án (TypeScript compile)
RUN npm run build

# Stage chạy ứng dụng
FROM node:20-alpine

WORKDIR /app

# Copy các file cần thiết từ stage builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Chạy ứng dụng
CMD ["node", "dist/index.js"]
