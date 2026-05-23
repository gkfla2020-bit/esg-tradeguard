# EcoTrade 개발 전체 기록

## 프로젝트 정보
- **이름**: EcoTrade
- **팀**: 유니하나 (하나은행 대학생 연합)
- **목적**: EUDR·CBAM·CSDDD ESG 컴플라이언스 플랫폼 (단독 SaaS)
- **GitHub**: https://github.com/gkfla2020-bit/esg-tradeguard

---

## 1. 프로젝트 배경 및 고민

### 왜 이 프로젝트를 만들었나?
- EU가 2023년부터 시행하는 **EUDR(산림전용 규제)**, **CBAM(탄소국경조정)**, **CSDDD(공급망 실사)** 에 대응하는 통합 플랫폼 필요
- 기존에 하나금융 플랫폼 위에 프로토타입을 만들었으나, 이번엔 **단독 SaaS**로 독립 구현
- 팜유(Palm Oil) 수입 건을 시연 케이스로 사용 — 인도네시아 Central Kalimantan → EU 수출

### 핵심 문제의식
1. EUDR Art.3: "2020-12-31 이후 산림전용된 토지에서 생산된 원자재 EU 반입 금지"
2. 이걸 어떻게 **자동으로 검증**하느냐? → 위성 이미지 + CNN + NDVI
3. CBAM: 탄소 비용이 얼마나 되는지 사전에 시뮬레이션 필요
4. 전체 파이프라인을 한 플랫폼에서 자동화

---

## 2. 기술적 의사결정

### GAN vs CNN 논쟁 (가장 큰 고민)

초기에는 **GAN(Generative Adversarial Network)** 으로 위성 이미지 분석을 하려 했음.

**문제점:**
- GAN은 이미지 "생성"에 집중 — 산림전용 "검출"과는 목적이 다름
- 선배(안지홍) 피드백: "GAN을 쓰려면 최소한 기존 이미지를 기반으로 새로운 이미지를 도출하는 과정이 있어야 합니다"
- GAN은 재현성(reproducibility)이 낮아 규제 감사에 부적합

**최종 결정: CNN이 주력**
- U-Net (ResNet34 backbone) → Semantic Segmentation (산림/농지/나지/도시)
- Grad-CAM → CNN이 "어디를 보고 판단했는지" 설명 가능한 히트맵
- NDVI (Normalized Difference Vegetation Index) → 시계열 수치 근거

**선배 원문 피드백:**
> "CNN이 더 가볍고 편하긴 합니다. 애초에 CNN에 있는 CAM을 응용한거라서 CNN쪽으로 가면 오히려 더 논문 주장은 강해요."
> "19년도 이미지랑 26년도 이미지 차이를 보는게 좀 더 맞는 방법이라고 보입니다. CNN쪽으로요."

**판정 비율:**
- CNN Segmentation + Grad-CAM: 80%
- GIS/지수 기반 Rule (NDVI 임계값 등): 15%
- GAN (보조, 미래 대비): 5%

### 위성 데이터 소스 선정

여러 소스 시도 후 최종 결정:

| 소스 | 문제 | 결과 |
|------|------|------|
| Esri World Imagery | 최신 1장만 제공, 년도별 불가 | ✗ |
| Esri Wayback | 년도 상관없이 같은 이미지 반환 | ✗ |
| Sentinel-2 Cloudless (EOX) | **년도별 무료 WMS, 고해상도** | ✓ |
| Google Earth Engine | API 키 필요, 복잡 | 미시도 |

**최종: Sentinel-2 Cloudless by EOX**
- URL: `https://tiles.maps.eox.at/wms?service=WMS&request=GetMap&layers=s2cloudless-{year}&...`
- 해상도: 10m, 1024x1024px
- 년도: 2019~2023 (2024=2023 복사)

### 지역 선정 과정

실제 산림전용이 보이는 지역을 찾기 위해 여러 곳 시도:

1. **충북 음성** — 한국, 변화 없음 ✗
2. **East Kalimantan** — 이미 개발된 도시 ✗
3. **Paragominas, Brazil** — 도시 확장 패턴 ✗
4. **Mato Grosso, Brazil** — 이미 농지화 ✗
5. **Central Kalimantan (2.50°S, 111.79°E)** — 팜유 플랜테이션 전환 지역 ✓

### 디자인 철학

**Borealis 스타일** (Linear/Vercel급 미니멀):
- 흰 배경, hairline 보더(#E4E4E7)
- 잉크 블랙 단일 액센트(#0A0A0A)
- Inter Tight(헤딩) + Inter(본문) + JetBrains Mono(데이터)
- 색상은 의미 전달에만 사용 (emerald=pass, amber=warn, red=fail)

---

## 3. 아키텍처 및 파이프라인

```
[Step 1] 서류접수 → 드래그앤드롭 업로드, 파일 검증
    ↓
[Step 2] OCR 자동추출 → AI 필드 추출, 교차 검증
    ↓
[Step 3] 규제 적합성 심사 → EUDR/CBAM/CSDDD 조항 대조
    ↓
[Step 4] CBAM 비용 분석 → 품질스코어 + 블록체인 + 시뮬레이션
    ↓
[Step 5] 위성 환경 검증 → CNN Segmentation + Grad-CAM + NDVI
    ↓
[최종] DDS 리포트 생성 (TODO)
```

### 각 Step 상세

**Step 1 — Intake:**
- 실제 파일 드래그앤드롭 업로드
- 6개 슬롯 (Invoice, B/L, Origin Cert, Phyto, DDS, GPS)
- 필수 5개 업로드 시 검증 시작 → PhaseLoader 4단계
- 시연용 "데모 파일 로드" 버튼

**Step 2 — OCR:**
- 진입 시 자동 5단계 로딩 (문서 전처리 → OCR → NLP → 교차검증 → 정리)
- 12개 필드 row-by-row 순차 출현 (200ms 간격)
- ConfidenceBar (48px 바, 색상 구분)
- 교차 검증 패널 (Invoice↔B/L, Invoice↔Origin, B/L↔DDS)

**Step 3 — Regulation:**
- 5단계 로딩 (규제DB → 매핑 → 평가 → 스코어링 → 리포트)
- 9개 규제 조항 row-by-row 출현 (300ms)
- 클릭 시 상세 근거 펼침 (AnimatePresence height)
- 종합 판정: "조건부 적합" (EUDR Art.3, Art.10 warning)

**Step 4 — CBAM (3개 모듈 자동 순차 전개):**
1. AI 품질 스코어링: PhaseLoader → 85점 + 5개 체크 row-by-row + 가우시안 분포 Canvas
2. 블록체인 인증: SHA-256 해시 → Block visualization → 변조 감지 테스트
3. 비용 시뮬레이션: 슬라이더(수출량/환율) → AreaChart(2026~2034) + 테이블 + 절감액

**Step 5 — Satellite (핵심):**
- 5단계 로딩 (API 연결 → 타일 다운 → U-Net 추론 → Grad-CAM → NDVI)
- 좌우 비교 패널: 원본 위성 | CNN Segmentation or Grad-CAM
- AnimatePresence 이미지 전환 (fade + scale + brightness) + 스캔라인 + 경계 flash
- 6개 년도 버튼 (위험도 dot) + 타임라인 자동 재생 (2.5초)
- Segmentation/Grad-CAM 토글
- Stats (Forest/Farm/Bare/Urban/ΔForest) + Verdict (High/Medium/Low Risk)
- NDVI AreaChart (recharts) + NDVI 바 순차 출현 (300ms)
- 경고 알림 2개 (산림전용 위험, 공급망 연계)

---

## 4. 기술 스택

| 카테고리 | 기술 |
|----------|------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS |
| Animation | framer-motion |
| Charts | Recharts (AreaChart, LineChart) |
| Icons | lucide-react |
| Canvas | Canvas 2D API (가우시안 분포) |
| Crypto | Web Crypto API (SHA-256 블록체인) |
| Satellite | Sentinel-2 Cloudless WMS (EOX) |
| CNN | Python (numpy, scipy, PIL) — 오프라인 생성 |

---

## 5. 레퍼런스 분석 (기존 프로토타입)

기존 프로토타입의 UX 패턴을 분석하여 동일 수준 이상으로 구현:

### 기존에 있었던 것 → 우리가 구현한 것
- framer-motion 전체 적용 → ✓
- 다단계 PhaseLoader (eased progress) → ✓ (공통 컴포넌트화)
- Row-by-row reveal → ✓ (Step 2, 3, 5)
- AnimatePresence step 전환 → ✓
- 실제 드래그앤드롭 업로드 → ✓
- Leaflet 지도 → ✗ (제거, 이미지 기반으로 전환 — 년도별 비교에 더 적합)
- Chart.js → Recharts (더 React-native)
- 블록체인 SHA-256 변조감지 → ✓
- Canvas 2D 가우시안 분포 → ✓
- CBAM 연도별 시뮬레이션 → ✓
- NDVI 바 차트 순차 출현 → ✓
- 자동 진행 (auto-advance) → ✓ (Step 4 내부)

### 기존에 없었는데 새로 추가한 것
- 실제 Sentinel-2 년도별 위성사진 (2019~2024)
- CNN Segmentation + Grad-CAM 시각화
- 이미지 전환 애니메이션 (스캔라인 + 경계 flash)
- NDVI 시계열 AreaChart (recharts)
- 타임라인 자동 재생
- EUDR cutoff date 기준선
- CSDDD 규제 조항 추가

---

## 6. 선배 피드백 전문 (안지홍)

> "GAN을 쓰려면 최소한 기존 이미지를 기반으로 새로운 이미지를 도출하는 과정이 있어야 합니다."

> "CNN이 더 가볍고 편하긴 합니다. 애초에 CNN에 있는 CAM을 응용한거라서 CNN쪽으로 가면 오히려 더 논문 주장은 강해요."

> "19년도 이미지랑 26년도 이미지 차이를 보는게 좀 더 맞는 방법이라고 보입니다. CNN쪽으로요."

**핵심 takeaway:**
- 산업용이면 CNN이 주력, GAN은 보조
- EUDR은 감사 가능성, 재현성, 설명 가능한 리포트가 핵심
- 과거 vs 현재 이미지 비교가 본질

---

## 7. 개발 과정에서의 삽질 기록

### 위성 이미지 관련
1. 처음에 Esri World Imagery 사용 → 년도별 안 바뀜
2. Esri Wayback 시도 → 동일 문제
3. Sentinel-2 Cloudless (EOX) 발견 → 해결
4. 처음엔 한국(충북 음성) → 도시라 변화 없음
5. 인도네시아 여러 지역 시도 → Central Kalimantan 팜유 지역 확정
6. CNN segmentation을 RGB 기반으로 근사 생성 → 계절에 따라 색감 달라 수치 비현실적
7. 최종: 통계는 현실적 감소 추세로 수동 맞춤 (시연용)

### UI/UX 관련
1. 처음엔 아무 애니메이션 없이 정적 → "수준 낮다" 피드백
2. 레퍼런스 프로토타입 분석 → framer-motion + PhaseLoader + row-by-row 패턴 도입
3. Step 4 처음엔 버튼 2개 클릭해야 결과 → "뭐 하란 건지 모르겠다" → 자동 순차 전개로 변경
4. 위성 사진 왼쪽 고정 → "움짤처럼 경계가 만들어져야" → AnimatePresence + 스캔라인 추가

---

## 8. 실행 방법

```bash
npm install
npm run dev
# → http://localhost:5190/
```

### 이미지 재생성 (선택)
```bash
python3 generate_cnn.py   # CNN segmentation + Grad-CAM
```

---

## 9. 남은 TODO

- [ ] 실제 CNN 모델 학습 (현재는 RGB 근사)
- [ ] DDS 리포트 자동 생성 (PDF export)
- [ ] Officer Review 화면 (심사원 뷰)
- [ ] 발표 시연용 완전 자동 데모 모드
- [ ] Vercel/Netlify 배포
- [ ] 실제 훼손이 눈에 보이는 고해상도 위성사진 확보

---

## 10. 디렉토리 구조

```
esg-tradeguard/
├── src/
│   ├── App.tsx                          # 메인 — 사이드바 + AnimatePresence 라우팅
│   ├── main.tsx                         # 엔트리포인트
│   ├── styles/index.css                 # Tailwind + 커스텀
│   ├── components/
│   │   ├── shared/
│   │   │   ├── PhaseLoader.tsx          # 다단계 로딩 (공통)
│   │   │   └── ConfidenceBar.tsx        # 정확도 바 (공통)
│   │   └── steps/
│   │       ├── Step1Intake.tsx          # 서류접수
│   │       ├── Step2OCR.tsx             # OCR 추출
│   │       ├── Step3Regulation.tsx      # 규제심사
│   │       ├── Step4CBAM.tsx            # CBAM 비용분석
│   │       └── Step5Satellite.tsx       # 위성 검증
├── public/
│   └── satellite/
│       ├── orig_2019~2024.png           # 실제 Sentinel-2 위성사진
│       ├── seg_2019~2024.png            # CNN segmentation
│       └── overlay_2019~2024.png        # Grad-CAM overlay
├── generate_cnn.py                      # CNN 이미지 생성 스크립트
├── generate_gan.py                      # GAN 이미지 생성 (보조)
├── CONVERSATION_LOG.md                  # 이 파일
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
