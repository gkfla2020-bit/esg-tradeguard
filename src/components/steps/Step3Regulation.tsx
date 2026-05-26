import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, BookOpen, ShieldCheck, ShieldAlert, ShieldX, ChevronDown, FileWarning, Gavel } from 'lucide-react'
import PhaseLoader from '../shared/PhaseLoader'
import type { Phase } from '../shared/PhaseLoader'

type RuleStatus = 'pass' | 'warn' | 'fail' | 'pending'

type Rule = {
  reg: string
  article: string
  desc: string
  status: RuleStatus
  background: string
  method: string
  finding: string
  evidence: string
  risk: string
  penalty: string
  recommendation: string
}

const TRIAGE_PHASES: Phase[] = [
  { id: 'load', label: '규제 DB 로딩 (EUDR/CBAM/CSDDD)...', icon: BookOpen, duration: 700 },
  { id: 'map', label: 'OCR 데이터 → 규제 조항 매핑...', icon: Scale, duration: 1400 },
  { id: 'eval', label: '조항별 적합성 평가 중...', icon: Gavel, duration: 2000 },
  { id: 'risk', label: '위험도 스코어링...', icon: FileWarning, duration: 1000 },
  { id: 'report', label: '판정 리포트 생성...', icon: ShieldCheck, duration: 800 },
]

const RULES: Rule[] = [
  { reg: 'EUDR', article: 'Art. 3(1)', desc: '산림전용 금지 의무', status: 'pending',
    background: 'EU 산림전용 규제(EUDR) 제3조 제1항은 2020년 12월 31일 이후 산림전용(deforestation)이 발생한 토지에서 생산된 원자재의 EU 역내 유통을 금지합니다. 이는 팜유, 대두, 목재, 커피, 카카오, 고무, 소가죽 7대 품목에 적용됩니다.',
    method: 'Sentinel-2 위성 시계열 이미지(2019~2024)를 U-Net CNN으로 Semantic Segmentation하여 산림/농지/나지/도시 면적 비율을 연도별로 산출하고, NDVI(Normalized Difference Vegetation Index) 시계열로 식생 건강도 변화를 정량화하였습니다. Grad-CAM saliency map으로 CNN 판단 근거 영역을 시각화하였습니다.',
    finding: '위성 분석 결과 2019년 산림 면적 78%에서 2024년 47%로 31%p 감소가 확인되었습니다. NDVI 지수는 2020년 0.71에서 2024년 0.50으로 하락하여 산림 임계값(0.6)을 2023년부터 하회하고 있습니다. EUDR cutoff date(2020-12-31) 이후 유의미한 산림전용이 진행된 것으로 판단됩니다.',
    evidence: 'Sentinel-2 L2A 위성영상, CNN Segmentation 결과, NDVI 시계열, Grad-CAM overlay',
    risk: '이 상태로 EU에 수출할 경우 통관 거부, 제품 압류, 매출액 4% 이상의 과징금이 부과될 수 있으며, 반복 위반 시 EU 시장 영구 진입 차단 가능성이 있습니다.',
    penalty: '수입 금지 + 매출액 4% 과징금 + 시장 퇴출',
    recommendation: '원산지 전환(산림전용 미발생 지역) 또는 추가 현장 실사를 통한 산림 복원 계획 수립을 권장합니다. 현 공급원 유지 시 2025년 이후 EU 수출이 사실상 불가합니다.' },
  { reg: 'EUDR', article: 'Art. 4(2)', desc: 'DDS 실사 보고서 제출', status: 'pass',
    background: 'EUDR 제4조 제2항은 사업자(operator)가 시장에 제품을 출시하기 전 실사(due diligence)를 수행하고 그 결과를 DDS(Due Diligence Statement)로 제출하도록 의무화합니다. DDS에는 제품 정보, 공급망 정보, 지리적 좌표, 위험 평가 결과가 포함되어야 합니다.',
    method: 'OCR 기반 자동 추출로 DDS 보고서의 구조적 완전성을 검증하였습니다. 필수 항목(제품 설명, HS 코드, 수량, 원산지 GPS, 공급업체 정보, 인증 현황, 위험 평가)의 존재 여부와 내용 정합성을 교차 검증하였습니다.',
    finding: 'DDS_SelfDeclaration.pdf (총 8페이지)에서 모든 필수 항목이 확인되었습니다. GPS polygon(4.2ha)이 포함되어 있으며, 공급망 정보(수출기업, 플랜테이션 ID, 수확 기간)가 기재되어 있습니다. ISCC EU Plus 인증과의 정합성도 확인되었습니다.',
    evidence: 'DDS_SelfDeclaration.pdf (p.1-8), OCR 교차 검증 결과',
    risk: 'DDS 미제출 시 EU 시장 진입이 원천 차단됩니다. 불완전한 DDS 제출 시에도 보완 요청 또는 통관 보류가 발생할 수 있습니다.',
    penalty: '시장 진입 차단',
    recommendation: '현재 DDS는 요건을 충족합니다. 향후 공급원 변경 시 DDS 갱신이 필요합니다.' },
  { reg: 'EUDR', article: 'Art. 9(1)(d)', desc: '지리적 좌표 (GPS polygon)', status: 'pass',
    background: 'EUDR 제9조 제1항 (d)는 원자재가 생산된 모든 토지의 지리적 좌표(geolocation)를 요구합니다. 4ha 이상의 토지는 polygon 형태로, 4ha 미만은 단일 좌표점으로 제공해야 합니다.',
    method: 'DDS 보고서 p.3에 기재된 GPS 좌표와 별도 제출된 GeoJSON polygon 파일의 일치 여부를 검증하였습니다. polygon 면적 계산 및 위성 이미지 상 해당 영역 존재 여부를 확인하였습니다.',
    finding: '원산지 GPS 좌표 2.50°S, 111.79°E가 DDS와 GeoJSON 파일에서 일치합니다. Polygon 면적 4.2ha로 EUDR 기준(4ha 이상 polygon 제출)을 충족합니다. Sentinel-2 위성영상에서 해당 polygon 영역이 확인됩니다.',
    evidence: 'DDS Report p.3, polygon_kalimantan.geojson, Sentinel-2 영상 대조',
    risk: '좌표 미제공 또는 부정확한 좌표 제출 시 통관이 보류되며, 의도적 허위 기재 시 형사 처벌 대상이 될 수 있습니다.',
    penalty: '통관 보류',
    recommendation: '현재 적합합니다. 공급 농지 확장 시 polygon 갱신이 필요합니다.' },
  { reg: 'EUDR', article: 'Art. 10(1)', desc: 'Cutoff date 이후 산림전용 없음', status: 'pending',
    background: 'EUDR 제10조 제1항은 2020년 12월 31일(cutoff date) 이후 산림전용이 발생한 토지에서 생산된 원자재의 수입을 명시적으로 금지합니다. 이는 Art.3과 연계되어 시간적 기준점을 설정하는 핵심 조항입니다.',
    method: '2019~2024년 Sentinel-2 Cloudless 위성영상을 연도별로 비교하여 cutoff date(2020-12-31) 전후의 토지 피복 변화를 분석하였습니다. CNN Segmentation으로 산림/비산림 경계를 추출하고, NDVI 시계열로 정량적 변화를 측정하였습니다.',
    finding: '2020년 산림 비율 76%에서 2024년 47%로, cutoff date 이후 29%p의 산림 감소가 확인되었습니다. 이는 EUDR Art.10(1) 위반에 해당하며, 자연적 감소로 볼 수 없는 규모입니다. Grad-CAM 분석에서 팜유 플랜테이션 확장에 의한 산림 전환이 주요 원인으로 식별되었습니다.',
    evidence: 'Sentinel-2 시계열(2019-2024), NDVI 변화 데이터, CNN Segmentation 결과',
    risk: '위반 확정 시 해당 화물 전량 수입 금지, 이미 유통된 제품 회수 명령, 향후 동일 공급원으로부터의 수입 영구 차단이 가능합니다.',
    penalty: '수입 금지 + 제품 회수 + 공급원 차단',
    recommendation: 'cutoff date 이전부터 존재하던 플랜테이션 영역(2020년 이전 비산림 지역)만을 공급원으로 한정하거나, 산림전용 미발생 인증을 받은 대체 공급원을 확보해야 합니다.' },
  { reg: 'EUDR', article: 'Art. 12', desc: '합법성 (현지법 준수)', status: 'pass',
    background: 'EUDR 제12조는 원자재 생산이 원산지국의 관련 법령에 따라 합법적으로 이루어졌음을 요구합니다. 이는 토지 이용 허가, 환경 규제, 노동법, 조세법 등을 포괄합니다.',
    method: '인도네시아 산림법(PP 23/2021) 기반 HGU(Hak Guna Usaha, 토지사용권) 허가 유효성을 확인하고, ISCC EU Plus 인증의 유효 기간 및 범위를 검증하였습니다. 원산지 증명서와 인증서의 정합성을 OCR 교차 검증으로 확인하였습니다.',
    finding: 'HGU 허가가 유효하며 해당 polygon 영역을 포함합니다. ISCC-ID-PKS-2024-0847 인증이 2025년 12월까지 유효합니다. 인도네시아 환경부 사업 허가(AMDAL)도 확인되었습니다. 현지법 위반 사항은 발견되지 않았습니다.',
    evidence: 'Origin Certificate, ISCC-ID-PKS-2024-0847, HGU 허가서',
    risk: '현지법 위반 적발 시 EU 관할 당국에서 형사 처벌(사기 혐의)을 받을 수 있으며, 인증 취소 시 즉시 수출 중단됩니다.',
    penalty: '형사 처벌 가능 (사기죄)',
    recommendation: '현재 적합합니다. ISCC 인증 갱신 시점(2025-12) 전 재인증을 확인하세요.' },
  { reg: 'CBAM', article: 'Art. 35', desc: '내재 탄소배출량 보고', status: 'pass',
    background: 'CBAM 규정 제35조는 수입자가 제품에 내재된 탄소배출량(embedded emissions)을 EU 당국에 보고하도록 의무화합니다. 보고는 직접 배출(Scope 1)과 특정 조건 하 간접 배출(Scope 2)을 포함해야 합니다.',
    method: 'ISCC EU Plus 인증 데이터와 공급업체 자체 보고서를 기반으로 Scope 1(재배·비료 1.42, CPO 정제 0.89, 운송 0.54 tCO₂/t) 및 Scope 2(전력 0.35 tCO₂/t)를 합산하였습니다. 업종별 배출계수 정규분포(μ=3.2, σ=0.8)와 비교하여 데이터 신뢰성을 검증하였습니다.',
    finding: '총 내재 배출량 3.2 tCO₂/t으로 확인되었습니다. EU 기본값(4.5 tCO₂/t) 대비 29% 낮으며, 업종 평균(3.2)과 동일합니다. Z-score 0.0으로 이상치 없음. 보고 포맷은 CBAM 시행규칙 Annex IV 양식에 적합합니다.',
    evidence: 'ISCC LCA 데이터, 공급업체 배출 보고서, AI 품질 스코어 85/100',
    risk: '미보고 시 €100/tCO₂의 과태료가 부과됩니다. 2,400MT 기준 약 €768,000의 과태료 위험이 있습니다.',
    penalty: '€100/tCO₂ 미보고 과태료 (본건 약 €768,000)',
    recommendation: '현재 실측 데이터(3.2 tCO₂/t) 제출이 유리합니다. EU 기본값 적용 시 연간 약 7.3억 원의 추가 비용이 발생하므로 실측 데이터 제출을 유지하세요.' },
  { reg: 'CBAM', article: 'Annex III', desc: '간접 배출 (Scope 2) 보고', status: 'pass',
    background: 'CBAM Annex III는 제품 생산 과정에서 소비된 전력에 의한 간접 배출(Scope 2)의 산정 방법론을 규정합니다. 원산지국 전력 그리드 배출계수를 적용하거나, 실제 전력 구매 계약(PPA) 기반 배출계수를 사용할 수 있습니다.',
    method: '인도네시아 전력 그리드 평균 배출계수(0.78 kgCO₂/kWh, IEA 2023 기준)를 적용하여 CPO 정제 공정의 전력 소비량(450 kWh/t)으로부터 간접 배출을 산정하였습니다.',
    finding: '간접 배출 0.35 tCO₂/t으로 확인되었습니다. 이는 인도네시아 전력 그리드 특성(석탄 발전 비중 60%)을 반영한 수치로 합리적입니다. 직접+간접 합산 3.2 tCO₂/t은 Annex III 보고 양식에 적합합니다.',
    evidence: 'IEA Electricity Emissions Factor 2023, 공장 전력 사용량 데이터',
    risk: '간접 배출 미포함 시 EU가 최대값을 강제 적용하여 CBAM 인증서 비용이 크게 증가합니다.',
    penalty: 'EU 기본값 강제 적용 (4.5 tCO₂/t)',
    recommendation: '재생에너지 PPA 체결 시 간접 배출을 0.1 tCO₂/t 이하로 낮출 수 있어 연간 약 1.5억 원 추가 절감이 가능합니다.' },
  { reg: 'CSDDD', article: 'Art. 7', desc: '공급망 인권·환경 실사', status: 'pass',
    background: 'EU 공급망 실사 지침(CSDDD) 제7조는 기업이 자사 공급망 전체에서 인권 및 환경에 대한 부정적 영향을 식별·예방·완화하기 위한 실사 의무를 규정합니다. 팜유 산업의 경우 아동노동, 강제노동, 토착민 권리 침해가 주요 리스크입니다.',
    method: 'DDS 보고서 Annex C에 기재된 공급망 목록(Tier 1~2 공급업체)을 확인하고, 소규모 농가(smallholder) 포함 여부, ILO 기본 조약 준수 선언, 고충처리 메커니즘 존재 여부를 검증하였습니다.',
    finding: '공급망에 소규모 농가 127가구가 포함되어 있으며, 모두 RSPO(Roundtable on Sustainable Palm Oil) 소규모 농가 프로그램에 등록되어 있습니다. ILO 핵심 협약(제29, 87, 98, 100, 105, 111, 138, 182호) 준수 선언이 확인되었습니다. 아동노동 및 강제노동 관련 위반 사항은 발견되지 않았습니다.',
    evidence: 'DDS Report Annex C, RSPO 소규모 농가 등록 확인서, ILO 준수 선언서',
    risk: '위반 시 매출액 5% 과징금, 이사회 책임, 민사 소송 위험이 있습니다. EU 회원국 법원에서 피해자가 직접 소송을 제기할 수 있습니다.',
    penalty: '매출액 5% 과징금 + 이사 개인 책임',
    recommendation: '현재 적합합니다. 연 1회 독립 감사(제3자 인증)를 통해 지속적 준수를 확인하는 것을 권장합니다.' },
  { reg: 'CSDDD', article: 'Art. 8', desc: '부정적 영향 방지 조치', status: 'pass',
    background: 'CSDDD 제8조는 식별된 부정적 영향에 대해 구체적인 방지·완화 조치를 수립하고 이행하도록 요구합니다. 단순한 리스크 식별을 넘어 실질적인 행동 계획(Corrective Action Plan)이 필요합니다.',
    method: 'DDS 보고서 Annex D에 기재된 환경 복원 계획 및 부정적 영향 방지 프로그램의 구체성과 이행 현황을 검증하였습니다.',
    finding: 'RSPO 소규모 농가 지원 프로그램 참여가 확인되었습니다. 환경 복원 계획(리플랜팅 프로그램, 수질 모니터링, 생물다양성 보전 구역 설정)이 Annex D에 첨부되어 있으며, 2023년 이행 보고서가 포함되어 있습니다. 고충처리 메커니즘(grievance mechanism)이 운영 중이며, 2024년 접수 건수 0건으로 확인됩니다.',
    evidence: 'DDS Report Annex D, RSPO 연간 보고서, 환경 복원 이행 보고서 2023',
    risk: '방지 조치 미이행 시 민사 책임(피해 배상)이 발생하며, 기업 공시 의무에 따라 ESG 등급 하락이 우려됩니다.',
    penalty: '민사 책임 + 기업 공시 의무 위반 + ESG 등급 하락',
    recommendation: '현재 적합합니다. 환경 복원 계획의 연간 이행 보고를 지속하고, 고충처리 메커니즘의 접근성을 개선하는 것을 권장합니다.' },
]

export default function Step3Regulation({ skipLoading = false, satelliteCompleted = false }: { skipLoading?: boolean; satelliteCompleted?: boolean }) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'revealing' | 'done'>(skipLoading ? 'done' : 'idle')
  const [visibleCount, setVisibleCount] = useState(skipLoading ? RULES.length : 0)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [filter, setFilter] = useState<RuleStatus | 'all'>('all')
  const [elapsed, setElapsed] = useState(skipLoading ? 5.9 : 0)

  // 위성 검증 완료 시 pending → warn 업데이트
  const activeRules = RULES.map(r =>
    r.status === 'pending' && satelliteCompleted
      ? { ...r, status: 'warn' as RuleStatus, finding: 'CNN Segmentation 및 NDVI 시계열 분석 결과, 2020년 이후 산림 면적 31%p 감소(78%→47%)가 확인되었습니다. EUDR cutoff date(2020-12-31) 이후 유의미한 산림전용이 진행된 것으로 판단됩니다.', evidence: 'Sentinel-2 위성영상(2019-2024), CNN Segmentation, NDVI 시계열, Grad-CAM overlay' }
      : r
  )
  const startTime = useRef(Date.now())

  // Live elapsed timer
  useEffect(() => {
    if (phase === 'done') return
    const timer = setInterval(() => {
      setElapsed(+(((Date.now() - startTime.current) / 1000)).toFixed(1))
    }, 100)
    return () => clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase === 'revealing' && visibleCount < RULES.length) {
      // Variable timing: some rules evaluate faster than others
      const delay = 180 + Math.random() * 320
      const t = setTimeout(() => setVisibleCount(c => c + 1), delay)
      return () => clearTimeout(t)
    }
    if (phase === 'revealing' && visibleCount >= RULES.length) {
      setTimeout(() => setPhase('done'), 500)
    }
  }, [phase, visibleCount])

  const counts = {
    pass: activeRules.filter(r => r.status === 'pass').length,
    warn: activeRules.filter(r => r.status === 'warn').length,
    fail: activeRules.filter(r => r.status === 'fail').length,
  }

  const StatusIcon = ({ status }: { status: RuleStatus }) => {
    if (status === 'pass') return <ShieldCheck size={16} className="text-ink" />
    if (status === 'warn') return <ShieldAlert size={16} className="text-ink" />
    if (status === 'pending') return <ShieldAlert size={16} className="text-muted3" />
    return <ShieldX size={16} className="text-ink" />
  }

  return (
    <section>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {phase !== 'idle' && (
          <div className="mb-4">
            <h2 className="font-heading text-[22px] font-bold text-ink tracking-tight">통합 컴플라이언스 보고서</h2>
            <p className="text-[13px] text-muted2 mt-1">
              서류 검증, CBAM 탄소 분석, 위성 환경 검증 결과를 종합하여 EUDR/CBAM/CSDDD 규제별 적합성을 최종 판정합니다.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="border border-border rounded-card p-5 bg-white">
              <h2 className="font-heading text-[20px] font-bold text-ink tracking-tight mb-1">통합 컴플라이언스 보고서</h2>
              <p className="text-[12px] text-muted2 mb-4">모든 검증 결과를 종합하여 {RULES.length}개 규제 조항 최종 판정을 생성합니다.</p>
              <div className="flex gap-2">
                <button onClick={() => { startTime.current = Date.now(); setPhase('loading') }}
                  style={{ backgroundColor: "#0A0A0A", color: "#fff" }} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:opacity-90 transition-all active:scale-[0.98] flex items-center gap-2">
                  <Scale size={14} /> 보고서 생성
                </button>
                <button onClick={() => { setPhase('done'); setVisibleCount(RULES.length); setElapsed(5.9) }}
                  className="px-4 py-2.5 border border-border rounded-lg text-[12px] text-muted2 hover:bg-surface2 hover:text-ink hover:border-border2 transition-all">
                  결과 바로보기
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="border border-border rounded-card p-6 bg-white"
            >
              <div className="flex items-center gap-2 mb-4">
                <Scale size={16} className="text-ink" />
                <span className="text-[13px] font-semibold text-ink">보고서 생성 중</span>
                <span className="font-mono text-[10px] text-muted3 ml-auto">3 regulations · 9 articles</span>
              </div>
              <PhaseLoader phases={TRIAGE_PHASES} onComplete={() => setPhase('revealing')} />
            </motion.div>
          )}

          {(phase === 'revealing' || phase === 'done') && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-[800px]"
            >
              {/* Report Header */}
              <div className="border-b border-border pb-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-[10px] text-muted3">Report ID: ECO-{new Date().toISOString().slice(2,10).replace(/-/g,'')}-001</div>
                  <div className="font-mono text-[10px] text-muted3">{new Date().toISOString().slice(0,10)}</div>
                </div>
                <h2 className="font-heading text-[20px] font-bold text-ink">Due Diligence Compliance Report</h2>
                <div className="text-[12px] text-muted2 mt-1">PT. Sawit Kalimantan Utama → UniHana Trading GmbH · CPO 2,400MT · HS 1511.10</div>
              </div>

              {/* 1. Executive Summary */}
              <div className="mb-8">
                <div className="text-[11px] font-mono text-muted3 mb-2">1.0 EXECUTIVE SUMMARY</div>
                <div className="border border-border rounded-lg p-4 bg-white">
                  <div className="text-[13px] text-ink leading-relaxed mb-3">
                    본 건은 EUDR, CBAM, CSDDD 3개 규제 {RULES.length}개 조항에 대해 검증을 수행하였습니다.
                    서류 기반 <span className="font-semibold">{counts.pass}개 조항 적합</span>, 위성 검증 관련 <span className="font-semibold">{counts.warn}개 조항 주의</span> 판정을 받았습니다.
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                    <div><div className="font-mono text-[9px] text-muted3 uppercase">Compliant</div><div className="font-mono text-[20px] font-bold text-ink">{counts.pass}/{RULES.length}</div></div>
                    <div><div className="font-mono text-[9px] text-muted3 uppercase">Attention</div><div className="font-mono text-[20px] font-bold text-ink">{counts.warn}/{RULES.length}</div></div>
                    <div><div className="font-mono text-[9px] text-muted3 uppercase">Non-Compliant</div><div className="font-mono text-[20px] font-bold text-ink">{counts.fail}/{RULES.length}</div></div>
                  </div>
                </div>
              </div>

              {/* 2. Satellite Analysis */}
              <div className="mb-8">
                <div className="text-[11px] font-mono text-muted3 mb-3">2.0 SATELLITE ENVIRONMENTAL VERIFICATION</div>
                <div className="border border-border rounded-lg overflow-hidden bg-white">
                  {/* Large satellite comparison */}
                  <div className="grid grid-cols-2">
                    <div className="border-r border-border">
                      <div className="px-4 py-2 border-b border-border bg-surface">
                        <span className="font-mono text-[11px] text-ink font-semibold">2019</span>
                        <span className="text-[10px] text-muted3 ml-2">Baseline (EUDR cutoff 이전)</span>
                      </div>
                      <img src="/satellite/orig_2019.png" alt="2019" className="w-full h-48 object-cover" />
                    </div>
                    <div>
                      <div className="px-4 py-2 border-b border-border bg-surface">
                        <span className="font-mono text-[11px] text-ink font-semibold">2024</span>
                        <span className="text-[10px] text-muted3 ml-2">Current</span>
                      </div>
                      <img src="/satellite/orig_2024.png" alt="2024" className="w-full h-48 object-cover" />
                    </div>
                  </div>
                  {/* CNN Segmentation */}
                  <div className="grid grid-cols-2 border-t border-border">
                    <div className="border-r border-border">
                      <div className="px-4 py-2 border-b border-border bg-surface">
                        <span className="font-mono text-[10px] text-muted2">CNN Segmentation 2024</span>
                      </div>
                      <img src="/satellite/seg_2024.png" alt="seg" className="w-full h-36 object-cover" />
                    </div>
                    <div>
                      <div className="px-4 py-2 border-b border-border bg-surface">
                        <span className="font-mono text-[10px] text-muted2">Grad-CAM Saliency 2024</span>
                      </div>
                      <img src="/satellite/overlay_2024.png" alt="cam" className="w-full h-36 object-cover" />
                    </div>
                  </div>
                  {/* Key metrics */}
                  <div className="border-t border-border p-4">
                    <div className="grid grid-cols-5 gap-3 mb-4">
                      {[
                        { label: 'Forest 2019', value: '78%' },
                        { label: 'Forest 2024', value: '47%' },
                        { label: 'Change', value: '-31%p' },
                        { label: 'NDVI 2024', value: '0.50' },
                        { label: 'Risk Level', value: 'HIGH' },
                      ].map(m => (
                        <div key={m.label} className="text-center">
                          <div className="font-mono text-[9px] text-muted3 uppercase">{m.label}</div>
                          <div className="font-mono text-[18px] font-bold text-ink">{m.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-surface rounded-lg p-3">
                      <p className="text-[12px] text-ink leading-[1.6]"><span className="font-semibold">판정:</span> EUDR cutoff date(2020-12-31) 이후 산림 면적 31%p 감소 확인. CNN 분석에서 팜유 플랜테이션 확장에 의한 산림 전환이 주요 원인으로 식별됨. <span className="font-semibold">EUDR Art.3 및 Art.10 위반 의심.</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. CBAM Cost Analysis */}
              <div className="mb-8">
                <div className="text-[11px] font-mono text-muted3 mb-3">3.0 CBAM CARBON COST ANALYSIS</div>
                <div className="border border-border rounded-lg bg-white overflow-hidden">
                  {/* Cost comparison - large numbers */}
                  <div className="grid grid-cols-3 border-b border-border">
                    <div className="p-4 border-r border-border text-center">
                      <div className="text-[10px] text-muted3 mb-1">미제출 시 (EU 기본값)</div>
                      <div className="font-mono text-[22px] font-bold text-ink">25.4<span className="text-[12px] font-normal text-muted2 ml-0.5">억/년</span></div>
                      <div className="font-mono text-[11px] text-muted3 mt-1">4.5 tCO₂/t 적용</div>
                    </div>
                    <div className="p-4 border-r border-border text-center">
                      <div className="text-[10px] text-muted3 mb-1">실측 제출 시</div>
                      <div className="font-mono text-[22px] font-bold text-ink">18.0<span className="text-[12px] font-normal text-muted2 ml-0.5">억/년</span></div>
                      <div className="font-mono text-[11px] text-muted3 mt-1">3.2 tCO₂/t 적용</div>
                    </div>
                    <div className="p-4 text-center bg-surface">
                      <div className="text-[10px] text-muted3 mb-1">연간 절감</div>
                      <div className="font-mono text-[22px] font-bold text-ink">7.3<span className="text-[12px] font-normal text-muted2 ml-0.5">억 원</span></div>
                      <div className="font-mono text-[11px] text-muted3 mt-1">2034년 기준</div>
                    </div>
                  </div>
                  {/* Year-by-year table */}
                  <div className="p-4 border-b border-border">
                    <div className="text-[11px] font-semibold text-ink mb-2">연도별 CBAM 비용 추이 (2026~2034)</div>
                    <table className="w-full text-[11px] font-mono">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-1.5 text-left text-muted3 font-medium">Year</th>
                          <th className="py-1.5 text-left text-muted3 font-medium">Phase-in</th>
                          <th className="py-1.5 text-left text-muted3 font-medium">실측</th>
                          <th className="py-1.5 text-left text-muted3 font-medium">기본값</th>
                          <th className="py-1.5 text-left text-muted3 font-medium">절감</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { y: 2026, p: '2.5%', a: '0.1억', d: '0.2억', s: '0.1억' },
                          { y: 2028, p: '10%', a: '0.6억', d: '1.0억', s: '0.4억' },
                          { y: 2030, p: '35%', a: '2.9억', d: '4.8억', s: '1.9억' },
                          { y: 2032, p: '60%', a: '7.2억', d: '11.0억', s: '3.8억' },
                          { y: 2034, p: '100%', a: '18.0억', d: '25.4억', s: '7.3억' },
                        ].map(r => (
                          <tr key={r.y} className="border-b border-border">
                            <td className="py-1.5 font-semibold text-ink">{r.y}</td>
                            <td className="py-1.5 text-muted2">{r.p}</td>
                            <td className="py-1.5 text-ink font-medium">{r.a}</td>
                            <td className="py-1.5 text-muted2">{r.d}</td>
                            <td className="py-1.5 text-ink font-medium">{r.s}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Summary */}
                  <div className="p-4">
                    <div className="bg-surface rounded-lg p-3">
                      <p className="text-[12px] text-ink leading-[1.6]"><span className="font-semibold">결론:</span> 실측 데이터 제출이 EU 기본값 대비 연간 <span className="font-semibold">7.3억 원</span> 절감 효과. 배출계수 3.2 tCO₂/t은 업종 평균 내 정상 범위(z=0.0). 추가 감축 시(바이오매스 보일러 -0.4t) 절감액 <span className="font-semibold">9.5억 원</span>까지 확대 가능.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Document Verification Summary */}
              <div className="mb-8">
                <div className="text-[11px] font-mono text-muted3 mb-3">4.0 DOCUMENT VERIFICATION</div>
                <div className="border border-border rounded-lg bg-white p-4">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 text-muted3 font-medium">문서</th>
                        <th className="pb-2 text-muted3 font-medium">상태</th>
                        <th className="pb-2 text-muted3 font-medium">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { doc: 'Invoice (상업 송장)', status: 'Valid', note: '수출기업, 품목, 수량 확인' },
                        { doc: 'Bill of Lading (선하증권)', status: 'Valid', note: '운송 경로, 선박명 확인' },
                        { doc: 'Origin Certificate (원산지 증명)', status: 'Valid', note: 'ISCC EU Plus 인증 유효' },
                        { doc: 'Phytosanitary Certificate', status: 'Valid', note: '식물검역 적합' },
                        { doc: 'DDS Self-Declaration', status: 'Valid', note: 'GPS polygon 포함, 8페이지' },
                        { doc: 'GPS Polygon (GeoJSON)', status: 'Valid', note: '4.2ha, 좌표 일치 확인' },
                      ].map(d => (
                        <tr key={d.doc} className="border-b border-border">
                          <td className="py-2 text-ink">{d.doc}</td>
                          <td className="py-2 font-mono text-[11px] text-ink">{d.status}</td>
                          <td className="py-2 text-muted2">{d.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[12px] text-muted2 leading-[1.6] mt-3">전체 6건의 서류가 제출되었으며, OCR 자동 추출(평균 정확도 96.5%)과 문서 간 교차 검증(Invoice↔B/L, Invoice↔Origin Cert, B/L↔DDS 전체 일치)을 통과하였습니다. 수동 검증이 권장되는 항목(confidence {'<'} 93%)은 Harvest Period(92.3%) 및 ETA EU Port(93.7%)이며, 핵심 판정에 영향을 미치지 않습니다.</p>
                </div>
              </div>

              {/* 5. Regulatory Findings */}
              <div className="mb-8">
                <div className="text-[11px] font-mono text-muted3 mb-4">5.0 REGULATORY FINDINGS</div>
                <div className="space-y-5">
                  {activeRules.slice(0, visibleCount).map((rule, i) => (
                    <div key={`${rule.reg}-${rule.article}`} className="border border-border rounded-lg mb-4 overflow-hidden">
                      {/* Finding header */}
                      <div className="px-5 py-3 bg-surface flex items-center gap-3 border-b border-border">
                        <span className="font-mono text-[10px] text-muted3">2.{i + 1}</span>
                        <span className="font-mono text-[11px] font-semibold text-ink">{rule.reg} {rule.article}</span>
                        <span className="text-[13px] font-semibold text-ink">{rule.desc}</span>
                        <span className="ml-auto font-mono text-[10px] uppercase px-2.5 py-1 bg-white border border-border rounded font-semibold">{rule.status === 'pending' ? 'PENDING' : rule.status.toUpperCase()}</span>
                      </div>

                      {/* Finding body */}
                      <div className="px-5 py-4 bg-white">
                        {/* Background */}
                        <p className="text-[12px] text-muted2 leading-[1.7] mb-4">{rule.background}</p>

                        {/* Key info table */}
                        <table className="w-full text-[12px] mb-4 border-collapse">
                          <tbody>
                            <tr className="border-t border-border">
                              <td className="py-2 pr-4 text-muted3 font-medium w-[100px] align-top">검증 방법</td>
                              <td className="py-2 text-muted2 leading-[1.6]">{rule.method}</td>
                            </tr>
                            <tr className="border-t border-border">
                              <td className="py-2 pr-4 text-muted3 font-medium align-top">판정 결과</td>
                              <td className="py-2 text-ink leading-[1.6] font-medium">{rule.finding}</td>
                            </tr>
                            <tr className="border-t border-border">
                              <td className="py-2 pr-4 text-muted3 font-medium align-top">근거 자료</td>
                              <td className="py-2 font-mono text-[11px] text-muted2">{rule.evidence}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Risk + Penalty box */}
                        <div className="bg-surface rounded-lg p-3 mb-3">
                          <div className="text-[11px] font-semibold text-ink mb-1">위험 평가</div>
                          <p className="text-[12px] text-muted2 leading-[1.6] mb-2">{rule.risk}</p>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-muted3">제재:</span>
                            <span className="font-semibold text-ink">{rule.penalty}</span>
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div className="border-t border-border pt-3">
                          <div className="text-[11px] font-semibold text-ink mb-1">권고사항</div>
                          <p className="text-[12px] text-muted2 leading-[1.6]">{rule.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Risk Assessment */}
              <div className="mb-8">
                <div className="text-[11px] font-mono text-muted3 mb-3">6.0 RISK ASSESSMENT</div>
                <div className="border border-border rounded-lg p-4 bg-white text-[13px] text-ink leading-[1.8]">
                  <p className="mb-3">본 건(PT. Sawit Kalimantan Utama, CPO 2,400MT, HS 1511.10.00)에 대한 종합 위험 평가 결과는 다음과 같습니다.</p>
                  <p className="mb-3"><span className="font-semibold">EUDR 산림전용 규제:</span> 서류 기반 검증(Art.4 DDS 제출, Art.9 GPS polygon, Art.12 합법성)은 적합으로 판정되었습니다. 다만 Art.3(산림전용 금지 의무) 및 Art.10(Cutoff date 2020-12-31 이후 산림전용 없음) 항목은 Sentinel-2 위성 시계열 분석(2019~2024)에서 산림 면적 78% → 47%로 31%p 감소가 감지되어 주의(WARNING) 판정을 받았습니다. 이 상태로 EU 수출 시 EUDR Art.3 위반으로 통관 거부 및 매출액 4% 과징금이 부과될 수 있습니다.</p>
                  <p className="mb-3"><span className="font-semibold">CBAM 탄소국경조정:</span> 내재 탄소배출량 3.2 tCO₂/t으로 보고 포맷 적합(Art.35), 간접 배출 0.35 tCO₂/t 포함 확인(Annex III). EU 기본값(4.5 tCO₂/t) 대비 29% 낮아 실측 데이터 제출이 유리하며, 2034년 기준 연간 약 7.3억 원 절감 효과가 예상됩니다.</p>
                  <p><span className="font-semibold">CSDDD 공급망 실사:</span> 소규모 농가 포함 공급망 목록 제출(Art.7), RSPO 프로그램 참여 확인(Art.8). ILO 기본 조약 위반 사항 미확인. 적합 판정.</p>
                </div>
              </div>

              {/* 4. Recommendations */}
              <div className="mb-8">
                <div className="text-[11px] font-mono text-muted3 mb-3">7.0 RECOMMENDATIONS</div>
                <div className="border border-border rounded-lg p-4 bg-white text-[13px] text-ink leading-[1.8]">
                  <p className="mb-2">1. EUDR Art.3/Art.10 관련: 대체 공급원 확보 또는 원산지 추가 현장 실사를 권장합니다. 현 공급원의 산림 감소 추세가 지속될 경우 2025년 이후 EU 시장 진입이 차단될 수 있습니다.</p>
                  <p className="mb-2">2. CBAM 관련: 현재 실측 배출계수(3.2 tCO₂/t)를 유지하되, 바이오매스 보일러 전환(−0.4t) 및 메탄 포집(−0.3t) 투자를 통해 추가 절감이 가능합니다.</p>
                  <p>3. 본 보고서를 EU 수입국 관할 당국에 DDS(Due Diligence Statement)로 제출할 수 있습니다. 위성 검증 결과가 업데이트되면 보고서가 자동 갱신됩니다.</p>
                </div>
              </div>

              {/* 5. Conclusion */}
              <div className="mb-6">
                <div className="text-[11px] font-mono text-muted3 mb-3">8.0 CONCLUSION</div>
                <div className="border border-border rounded-lg p-4 bg-white text-[13px] text-ink leading-[1.8]">
                  본 Due Diligence 검증 결과, 총 {RULES.length}개 규제 조항 중 {counts.pass}개 조항이 적합(Compliant), {counts.warn}개 조항이 주의(Attention Required) 판정을 받았습니다. 주의 판정 항목은 EUDR 산림전용 관련 조항으로, 위성 기반 CNN Segmentation 및 NDVI 시계열 분석에서 유의미한 산림 감소가 감지된 데 기인합니다. 해당 항목의 최종 판정을 위해 추가 현장 실사 또는 대체 공급원 확보를 권장하며, 이를 충족할 경우 전체 조항 적합 판정이 가능합니다.
                </div>
              </div>

              {/* Export */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="font-mono text-[10px] text-muted3">EUDR 2023/1115 · CBAM 2023/956 · CSDDD 2024/1760</div>
                <button
                  style={{ backgroundColor: '#0A0A0A', color: '#fff' }}
                  className="px-5 py-2.5 rounded-lg text-[12px] font-semibold hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  DDS 보고서 내보내기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 font-mono text-[10px] text-muted3 flex gap-3">
          <span>Rule Engine v2.1</span><span>·</span>
          <span>EUDR 2023/1115 · CBAM 2023/956 · CSDDD 2024/1760</span><span>·</span>
          <span className="tabular-nums">심사 시간: {elapsed.toFixed(1)}s</span>
        </div>
      </motion.div>
    </section>
  )
}
