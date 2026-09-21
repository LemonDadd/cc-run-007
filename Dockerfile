# ---- 构建阶段 ----
FROM node:20-alpine AS build
WORKDIR /app

# 先装依赖（利用 Docker 层缓存）
COPY package.json package-lock.json* ./
RUN npm ci || npm install --no-audit --no-fund

# 拷贝源码并构建（音效在 prebuild 阶段本地生成，无任何网络资源）
COPY . .
RUN npm run build

# ---- 托管阶段 ----
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 1420
# 简单健康检查（容器内 wget）
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:1420/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
