# EcoTrade 프로젝트 현황

## 기본 정보
- **프로젝트명**: EcoTrade
- **팀**: 유니하나 (하나은행 대학생 연합)
- **GitHub**: https://github.com/gkfla2020-bit/esg-tradeguard
- **기술 스택**: React 18 + TypeScript + Vite + Tailwind + framer-motion + Recharts
- **총 커밋 수**: 77개
- **최종 업데이트**: 2026-05-24

---

## 기획 목적

EU의 3대 환경 규제(EUDR, CBAM, CSDDD)에 대응하는 **통합 컴플라이언스 자동화 플랫폼**.
수입 기업이 EU에 원자재를 수출할 때 필요한 서류 검증 → OCR 추출 → 규제 적합성 심사 → 탄소비용 산정 → 위성 기반 산림전용 검증까지 5단계를 하나의 파이프라인으로 자동화.

**시연 케이스**: 인도네시아 Central Kalimantan → EU 팜유(CPO) 수출 건

---

## 완료된 단계

### Step 1: 서류 접수 (Intake) ✅
- 드래그앤드롭 파일 업로드 (6개 슬롯)
- 필수 서류 5종 + 선택 1종 (GPS polygon)
- "샘플 케이스 불러오기" 시연용 버튼
- 파일 검증 PhaseLoader → 완료 시 자동 인식 결과 표시
- 인식 결과: 수출기업, 수입기업, HS코드, 업종분류, 원산지, 수량, 인증, 적용규제
- 업종별(Palm Oil) 규제 요건 체크리스트 (EUDR/CBAM/CSDDD)

### Step 2: OCR 자동 추출 ✅
- "OCR 추출 실행" 버튼 클릭으로 시작 (사용자 주도)
- PhaseLoader 로딩 → 12개 필드 row-by-row 순차 출현
- ConfidenceBar (정확도 시각화)
- confidence < 93% 필드: amber underline + "Review" 버튼
- STP률(Straight-Through Processing) KPI
- 교차 검증 패널 (Invoice↔B/L, Invoice↔Origin, B/L↔DDS)
- "결과 바로보기" 시연용 스킵 버튼

### Step 3: 규제 적합성 심사 ✅
- "규제 심사 실행" 버튼 클릭으로 시작
- EUDR/CBAM/CSDDD 9개 조항 자동 대조
- 위성 의존 항목(Art.3, Art.10) → "pending" 상태 (Step 5 완료 필요)
- 각 조항에 "위반 시 제재" 표시 (수입 금지, 매출액 4% 과징금 등)
- PASS/WARNING/FAIL 필터링 (카드 클릭)
- 클릭 시 상세 근거 + 위반 제재 펼침
- 종합 판정: "서류 적합 · 위성 검증 대기"
- pending 항목에 "Step 5에서 검증 →" 링크

### Step 4: CBAM 비용 분석 ✅
- 진입 시 자동 3모듈 순차 전개:
  1. **AI 품질 스코어링**: 85점 + 5개 체크 + Recharts 가우시안 분포 차트
  2. **블록체인 인증**: SHA-256 해시 + 블록 시각화 + 변조 감지 테스트
  3. **비용 시뮬레이션**: 슬라이더(수출량/환율) + 2026~2034 AreaChart + 연도별 테이블
- "이 플랫폼이 없으면?" 핵심 메시지 (기본값 4.5 vs 실측 3.2 → 절감)
- 비교 카드: 기본값 → 실측 = 절감 (monochrome)
- 권고사항 2줄
- CSV 내보내기 버튼

### Step 5: 위성 환경 검증 ✅
- "CNN 분석 실행" 버튼 클릭으로 시작
- 6개 년도(2019~2024) 위성 썸네일 미리보기
- 분석 진행바 (~3초) → 결과
- 분석 파이프라인 5단계 표시 (Sentinel-2 → U-Net → Grad-CAM → NDVI → 판정)
- 좌우 비교: 원본 위성 | CNN Segmentation or Grad-CAM
- AnimatePresence 이미지 전환 + 스캔라인
- 6개 년도 버튼 (위험도 dot) + 타임라인 자동 재생
- Stats (Forest/Farm/Bare/Urban) + 전년 대비 delta
- Verdict (High/Medium/Low Risk)
- NDVI AreaChart + 바 순차 출현
- 분석 소견 (불릿 리스트, 비즈니스 영향)
- "DDS 리포트 생성" 최종 CTA
- "재분석" 버튼
- "PDF Report" 내보내기

---

## 완료된 공통 기능

| 기능 | 상태 |
|------|------|
| 시작 화면 (PPT 스타일) | ✅ |
| 사이드바 네비게이션 | ✅ |
| 케이스 진행바 (5칸) | ✅ |
| 헤더 progress bar | ✅ |
| 헤더 breadcrumb | ✅ |
| 라이브 시계 | ✅ |
| 동적 케이스 번호/날짜 | ✅ |
| 키보드 네비게이션 (←→) | ✅ |
| document.title 연동 | ✅ |
| Step 전환 AnimatePresence | ✅ |
| 재방문 시 로딩 스킵 | ✅ |
| 방향별 슬라이드 (forward/back) | ✅ |
| 스크롤 자동 리셋 | ✅ |
| 위성 이미지 프리로드 | ✅ |
| focus-visible ring (접근성) | ✅ |
| range input 커스텀 스타일 | ✅ |
| user-select: none (UI 크롬) | ✅ |
| tabular-nums 전역 | ✅ |
| 하단 키보드 힌트 바 | ✅ |

---

## 미완료 / TODO

| 항목 | 우선순위 | 비고 |
|------|---------|------|
| Step 1 업종 선택 → 업종별 필수 서류 분기 | 높음 | 현재 Palm Oil 하드코딩 |
| Step 5 완료 → Step 3 pending 항목 자동 업데이트 | 높음 | 현재 독립적으로 동작 |
| 실제 CNN 모델 학습 (현재 RGB 근사) | 중간 | 논문용 |
| DDS 리포트 PDF 생성 기능 | 중간 | 버튼만 있음 |
| CSV 내보내기 실제 구현 | 낮음 | 버튼만 있음 |
| 3D 시작 화면 비주얼 | 보류 | Three.js 크래시 문제 |
| Officer Review 화면 (심사원 뷰) | 낮음 | |
| Vercel/Netlify 배포 | 낮음 | |
| 실제 훼손 위성사진 교체 | 중간 | 현재 Sentinel-2 cloudless |

---

## 기술적 의사결정 요약

| 결정 | 이유 |
|------|------|
| GAN → CNN | CNN이 재현성/감사 가능성 높음, 선배 피드백 |
| Leaflet → 이미지 기반 | 년도별 비교에 더 적합 |
| Chart.js → Recharts | React-native, 선언적 |
| 자동 로딩 → 버튼 클릭 | 실제 도구 패턴 (사용자 주도) |
| 노란 경고박스 제거 | AI 생성 느낌 제거 |
| 색상 떡칠 → monochrome | 프로 도구 톤앤매너 |
| Three.js → 제거 | 런타임 크래시 |
| bg-ink → inline style | Tailwind 커스텀 색상 미적용 환경 대응 |

---

## 선배 피드백 (안지홍)

> "CNN이 더 가볍고 편하긴 합니다. 애초에 CNN에 있는 CAM을 응용한거라서 CNN쪽으로 가면 오히려 더 논문 주장은 강해요."

> "19년도 이미지랑 26년도 이미지 차이를 보는게 좀 더 맞는 방법이라고 보입니다."

---

## 실행 방법

```bash
cd ~/Desktop/esg-tradeguard
npm install
npm run dev
```
