#!/bin/bash

# Script thiết lập môi trường VPS cho Nhà Cam Homestay
# Hệ điều hành khuyến nghị: Ubuntu 22.04 LTS

set -e

echo "🚀 Bắt đầu thiết lập VPS..."

# 1. Cập nhật hệ thống
echo "📦 Đang cập nhật hệ thống..."
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt các công cụ cơ bản
echo "🛠️ Đang cài đặt các công cụ cơ bản..."
sudo apt install -y curl git build-essential

# 3. Cài đặt Docker
if ! [ -x "$(command -v docker)" ]; then
    echo "🐳 Đang cài đặt Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "✅ Docker đã được cài đặt."
fi

# 4. Cài đặt Docker Compose
if ! [ -x "$(command -v docker-compose)" ]; then
    echo "🐙 Đang cài đặt Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose đã được cài đặt."
fi

# 5. Cài đặt Nginx và Certbot
echo "🌐 Đang cài đặt Nginx và Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

# 6. Mở Firewall
echo "🧱 Đang cấu hình Firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow 22
sudo ufw --force enable

echo "✅ Thiết lập VPS hoàn tất!"
echo "💡 Vui lòng logout và login lại để quyền Docker có hiệu lực."
