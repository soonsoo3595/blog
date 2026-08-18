FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
# canvas(react-notion-x의 수식 렌더링 경로에서 씀)가 네이티브 빌드가 필요한데,
# alpine 베이스 이미지엔 빌드 도구가 없어서 npm ci가 실패한다.
RUN apk update && apk add --no-cache python3 make g++ pkgconfig cairo-dev jpeg-dev pango-dev giflib-dev
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* 값들은 next build 시점에 클라이언트 번들에 그대로 굽혀 들어가서
# 런타임 .env 주입으로는 못 바꾼다 (DOCKER.md의 "시크릿은 ARG/ENV로 안 굽는다" 규칙의
# 예외 - 아래 값들은 전부 giscus 위젯 자체가 페이지에 노출하는 값이라 비밀값이 아님).
ARG NEXT_PUBLIC_SITE_URL=https://devbap.co.kr
ARG NEXT_PUBLIC_GISCUS_REPO=soonsoo3595/blog
ARG NEXT_PUBLIC_GISCUS_REPO_ID=R_kgDOTsm4bw
ARG NEXT_PUBLIC_GISCUS_CATEGORY=Comments
ARG NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDOTsm4b84DCyPp
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GISCUS_REPO=$NEXT_PUBLIC_GISCUS_REPO \
    NEXT_PUBLIC_GISCUS_REPO_ID=$NEXT_PUBLIC_GISCUS_REPO_ID \
    NEXT_PUBLIC_GISCUS_CATEGORY=$NEXT_PUBLIC_GISCUS_CATEGORY \
    NEXT_PUBLIC_GISCUS_CATEGORY_ID=$NEXT_PUBLIC_GISCUS_CATEGORY_ID

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# standalone 출력은 import되는 파일만 자동으로 담아서, About.tsx가 런타임에
# fs로 직접 읽는 about.md는 따로 복사해야 한다.
COPY --from=builder --chown=nextjs:nodejs /app/src/content ./src/content

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
