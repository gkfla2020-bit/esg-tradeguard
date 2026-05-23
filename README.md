# EcoTrade — EUDR/CBAM ESG Compliance Platform

EU 환경 규제(EUDR, CBAM, CSDDD) 대응을 위한 통합 컴플라이언스 플랫폼.  
위성 이미지 기반 CNN 산림전용 검증 + 탄소비용 시뮬레이션.

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:5190/
```

## Pipeline (5 Steps)

| Step | 기능 | 핵심 기술 |
|------|------|-----------|
| 1. Intake | 서류 업로드·검증 | Drag & Drop, PhaseLoader |
| 2. OCR | AI 자동 추출 | NLP 필드 추출, 교차검증 |
| 3. Regulation | 규제 적합성 심사 | EUDR/CBAM/CSDDD 9개 조항 |
| 4. CBAM | 탄소비용 분석 | 품질스코어 + 블록체인 + 시뮬레이션 |
| 5. Satellite | 위성 환경 검증 | U-Net + Grad-CAM + NDVI |

## Tech Stack

- React 18 + TypeScript + Vite 6
- Tailwind CSS + framer-motion
- Recharts + Canvas 2D API
- lucide-react + Web Crypto (SHA-256)
- Sentinel-2 Cloudless (EOX) 위성 데이터

## Team

유니하나 (하나은행 대학생 연합)
