/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Settings, 
  FileText, 
  ClipboardCheck, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle,
  Download,
  Info,
  CheckCircle2,
  Factory
} from 'lucide-react';
import { 
  FacilityCategory, 
  DiagnosisVerdict, 
  UserInput, 
  DiagnosisResult,
  EquipmentSpec
} from './types';
import { AIR_LAW_CRITERIA, GET_REQUIRED_DOCS } from './data/laws';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserInput>({
    facilityName: '',
    location: '본사 공장 (한화에어로스페이스)',
    installationDate: new Date().toISOString().split('T')[0],
    equipment: {
      name: '',
      category: FacilityCategory.AIR,
      type: AIR_LAW_CRITERIA[0].id,
      capacity: 0,
      unit: AIR_LAW_CRITERIA[0].unit,
      pollutants: []
    }
  });

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const handleDiagnose = () => {
    const selectedCriteria = AIR_LAW_CRITERIA.find(c => c.id === formData.equipment.type);
    if (!selectedCriteria) return;

    let verdict = DiagnosisVerdict.EXEMPT;
    let reason = '';

    if (formData.equipment.capacity >= selectedCriteria.thresholdPermit) {
      verdict = DiagnosisVerdict.PERMIT;
      reason = `기준치(${selectedCriteria.thresholdPermit}${selectedCriteria.unit}) 이상으로 '허가' 대상입니다.`;
    } else if (formData.equipment.capacity >= selectedCriteria.thresholdNotification) {
      verdict = DiagnosisVerdict.NOTIFICATION;
      reason = `기준치(${selectedCriteria.thresholdNotification}${selectedCriteria.unit}) 이상으로 '신고' 대상입니다.`;
    } else {
      verdict = DiagnosisVerdict.EXEMPT;
      reason = `기준치 미만으로 인허가 대상 시설이 아닙니다. (단, 타 법령 검토 필요)`;
    }

    setDiagnosis({
      verdict,
      applicableLaw: '대기환경보전법 제23조',
      reason,
      requiredDocuments: GET_REQUIRED_DOCS(formData.equipment.category)
    });
    setStep(4);
  };

  const generatePDF = () => {
    if (!diagnosis) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('환경 인허가 자가진단 결과서', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`출력일시: ${new Date().toLocaleString()}`, 195, 30, { align: 'right' });
    doc.setFontSize(14);
    doc.text('1. 시설 정보', 20, 45);
    (doc as any).autoTable({
      startY: 50,
      head: [['항목', '내용']],
      body: [
        ['시설명', formData.facilityName],
        ['설치위치', formData.location],
        ['설치예정일', formData.installationDate],
        ['시설종류', formData.equipment.type],
        ['용량/규모', `${formData.equipment.capacity} ${formData.equipment.unit}`],
      ],
    });
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.text('2. 진단 결과', 20, finalY + 15);
    (doc as any).autoTable({
      startY: finalY + 20,
      head: [['판정 결과', '적용 법령', '상세 사유']],
      body: [
        [
          diagnosis.verdict === DiagnosisVerdict.PERMIT ? '허가 대상' : 
          diagnosis.verdict === DiagnosisVerdict.NOTIFICATION ? '신고 대상' : '대상 외',
          diagnosis.applicableLaw,
          diagnosis.reason
        ]
      ],
    });
    const docsY = (doc as any).lastAutoTable.finalY || finalY + 20;
    doc.text('3. 필요 첨부 서류', 20, docsY + 15);
    (doc as any).autoTable({
      startY: docsY + 20,
      head: [['순번', '서류명']],
      body: diagnosis.requiredDocuments.map((doc, idx) => [idx + 1, doc]),
    });
    doc.save(`EcoPermit_Report_${formData.facilityName}.pdf`);
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-500 text-white shadow-sm shadow-orange-200">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none">Eco-Permit Navigator</h1>
            <p className="text-[10px] font-medium text-slate-500 mt-1">Hanwha Aerospace Environmental Compliance System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            최신 법령 동기화 완료: 2026.07.16
          </span>
          <div className="h-8 w-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
            <Settings size={16} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-64 flex-shrink-0 flex-col gap-8 border-r border-slate-200 bg-white p-6">
          <nav className="space-y-1">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">업무 프로세스</div>
            {[
              { id: 1, label: '시설 사양 입력', icon: <FileText size={16} /> },
              { id: 2, label: '법령 필터링', icon: <Factory size={16} /> },
              { id: 3, label: '세부 사양 입력', icon: <Settings size={16} /> },
              { id: 4, label: '진단 결과 확인', icon: <ClipboardCheck size={16} /> }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  if (s.id < step || (diagnosis && s.id <= 4)) setStep(s.id);
                }}
                disabled={s.id > step && !diagnosis}
                className={`flex w-full items-center gap-3 rounded-lg p-3 text-sm font-semibold transition-all ${
                  step === s.id 
                    ? 'bg-orange-50 text-orange-600 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 disabled:opacity-30'
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors ${
                  step === s.id ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {s.id}
                </span>
                {s.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-tighter text-slate-400">도움말 / 툴팁</p>
            <p className="text-[11px] leading-relaxed italic text-slate-600">
              "배출시설의 범위는 대기환경보전법 시행규칙 [별표 3]을 기준으로 합니다. 용량 계산 시 시간당 증발량을 확인하세요."
            </p>
          </div>
        </aside>

        {/* Working Area */}
        <section className="flex flex-1 flex-col overflow-hidden p-8 gap-6">
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Step Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {step === 1 && '[Step 01] 신규 설비 기본 정보 입력'}
                  {step === 2 && '[Step 02] 적용 법령 필터링'}
                  {step === 3 && '[Step 03] 세부 사양 및 오염물질'}
                  {step === 4 && '[Step 04] 자가진단 결과'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {step === 1 && '도입 예정인 설비의 상세 제원을 입력해 주세요.'}
                  {step === 2 && '설비의 특성에 맞는 관리 법령을 분류합니다.'}
                  {step === 3 && '법적 기준치와 비교를 위한 정량 데이터를 입력하세요.'}
                  {step === 4 && '입력된 정보를 바탕으로 법규 준수 여부를 확인합니다.'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button 
                    onClick={() => setStep(step - 1)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    이전
                  </button>
                )}
                {step < 3 ? (
                  <button 
                    onClick={() => setStep(step + 1)}
                    disabled={step === 1 && !formData.facilityName}
                    className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                  >
                    다음 단계
                  </button>
                ) : step === 3 ? (
                  <button 
                    onClick={handleDiagnose}
                    className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                  >
                    판정 실행
                  </button>
                ) : (
                  <button 
                    onClick={() => { setStep(1); setDiagnosis(null); }}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>

            {/* Step Body */}
            <div className="flex-1 overflow-y-auto p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-700">시설(설비) 명칭</label>
                        <input 
                          type="text" 
                          placeholder="예: 테크윈 2공장 No.4 열풍건조기" 
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                          value={formData.facilityName}
                          onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-700">설치 예정 위치</label>
                        <select 
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm appearance-none outline-none focus:ring-2 focus:ring-orange-500/20"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        >
                          <option>본사 공장 (한화에어로스페이스)</option>
                          <option>창원 사업장</option>
                          <option>대전 사업장</option>
                          <option>보은 사업장</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-700">설치 예정일</label>
                        <input 
                          type="date" 
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                          value={formData.installationDate}
                          onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                        />
                      </div>
                      <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1">
                          <Info size={14} /> 알림
                        </div>
                        <p className="text-[11px] text-blue-600 leading-relaxed">
                          설치 예정일로부터 최소 30일 전에는 인허가 절차가 완료되어야 합니다.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-700 tracking-wider">적용 법령 필터링 (복수 선택 가능)</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: FacilityCategory.AIR, label: '대기환경보전법', desc: '연소, 건조, 도장시설 등' },
                        { id: FacilityCategory.WATER, label: '물환경보전법', desc: '폐수, 수처리 시설 등' },
                        { id: FacilityCategory.CHEMICAL, label: '화학물질관리법', desc: '유해화학물질 사용시설' },
                        { id: FacilityCategory.NOISE, label: '소음진동관리법', desc: '송풍기, 압축기 등' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setFormData({ ...formData, equipment: { ...formData.equipment, category: cat.id } })}
                          className={`flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                            formData.equipment.category === cat.id 
                              ? 'border-orange-500 bg-orange-50/50 shadow-sm' 
                              : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                          }`}
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            formData.equipment.category === cat.id ? 'bg-orange-500 text-white' : 'bg-white text-slate-400'
                          }`}>
                            {cat.id === FacilityCategory.AIR ? <Factory size={20} /> : <AlertCircle size={20} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{cat.label}</div>
                            <div className="text-xs text-slate-500">{cat.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <div className="space-y-6">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-700">세부 시설 분류</label>
                        <select 
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm appearance-none outline-none focus:ring-2 focus:ring-orange-500/20"
                          value={formData.equipment.type}
                          onChange={(e) => {
                            const selected = AIR_LAW_CRITERIA.find(c => c.id === e.target.value);
                            setFormData({ ...formData, equipment: { ...formData.equipment, type: e.target.value, unit: selected?.unit || '' } });
                          }}
                        >
                          {AIR_LAW_CRITERIA.map(c => <option key={c.id} value={c.id}>{c.facilityType}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-700">최대 용량 / 규모</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            placeholder="0.00" 
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                            value={formData.equipment.capacity}
                            onChange={(e) => setFormData({ ...formData, equipment: { ...formData.equipment, capacity: Number(e.target.value) } })}
                          />
                          <span className="absolute right-4 top-3 text-[10px] font-bold uppercase text-slate-400">{formData.equipment.unit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="mb-2 block text-xs font-bold uppercase text-slate-700">오염물질 발생 예상 종류</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['먼지', '질소산화물(NOx)', '황산화물(SOx)', '일산화탄소(CO)', 'THC(총탄화수소)'].map((p) => (
                          <label key={p} className={`flex items-center gap-2 rounded-lg border p-3 transition-all cursor-pointer ${
                            formData.equipment.pollutants.includes(p) ? 'border-orange-500 bg-orange-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}>
                            <input 
                              type="checkbox" 
                              className="accent-orange-500 h-4 w-4"
                              checked={formData.equipment.pollutants.includes(p)}
                              onChange={() => {
                                const current = formData.equipment.pollutants;
                                const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
                                setFormData({ ...formData, equipment: { ...formData.equipment, pollutants: next } });
                              }}
                            />
                            <span className="text-[11px] font-medium text-slate-700">{p}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && diagnosis && (
                  <motion.div key="4" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                    <div className={`rounded-2xl p-8 text-center ${
                      diagnosis.verdict === DiagnosisVerdict.PERMIT ? 'bg-red-50' : 
                      diagnosis.verdict === DiagnosisVerdict.NOTIFICATION ? 'bg-orange-50' : 'bg-green-50'
                    }`}>
                      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                        diagnosis.verdict === DiagnosisVerdict.PERMIT ? 'bg-red-500 text-white' : 
                        diagnosis.verdict === DiagnosisVerdict.NOTIFICATION ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {diagnosis.verdict === DiagnosisVerdict.EXEMPT ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                      </div>
                      <h3 className={`text-2xl font-bold ${
                        diagnosis.verdict === DiagnosisVerdict.PERMIT ? 'text-red-700' : 
                        diagnosis.verdict === DiagnosisVerdict.NOTIFICATION ? 'text-orange-700' : 'text-green-700'
                      }`}>
                        {diagnosis.verdict === DiagnosisVerdict.PERMIT ? '설치 허가 대상' : 
                         diagnosis.verdict === DiagnosisVerdict.NOTIFICATION ? '설치 신고 대상' : '인허가 대상 외'}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 font-medium">{diagnosis.reason}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                          <Info size={16} className="text-blue-500" /> 상세 정보
                        </h4>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400">적용 법규</span>
                            <span className="font-bold text-slate-700">{diagnosis.applicableLaw}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">시설 분류</span>
                            <span className="font-bold text-slate-700">{formData.equipment.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">오염물질</span>
                            <span className="font-bold text-slate-700">{formData.equipment.pollutants.join(', ') || '없음'}</span>
                          </div>
                        </div>
                        <button 
                          onClick={generatePDF}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-95"
                        >
                          <Download size={18} /> 리포트 다운로드
                        </button>
                      </div>

                      <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                          <FileText size={16} className="text-orange-500" /> 구비 서류 리스트
                        </h4>
                        <div className="space-y-2">
                          {diagnosis.requiredDocuments.map((doc, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 text-[11px] font-medium text-slate-700">
                              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                              {doc}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step Footer (Law Reference) */}
            <div className="border-t border-slate-100 bg-slate-50 px-8 py-4">
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                <span>
                  {step === 1 && '시설 명칭 및 위치는 사내 설비 자산 대장(Asset Register)과 일치해야 합니다.'}
                  {step === 2 && '대기환경보전법 시행규칙 [별표 3]에 따른 배출시설 해당 여부를 1차 필터링합니다.'}
                  {step === 3 && '용량 산정은 설계 사양서 또는 설비 명판(Nameplate)을 기준으로 입력하세요.'}
                  {step === 4 && '본 결과는 참고용이며, 최종 신고 수리 전까지 인허가 담당자의 확인이 필요합니다.'}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Widgets */}
          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">관련 법령 매칭</span>
              <div className="mt-1 text-lg font-bold text-slate-800">
                {formData.equipment.category === FacilityCategory.AIR ? '대기환경보전법' : 
                 formData.equipment.category === FacilityCategory.WATER ? '물환경보전법' : '관리 법령 검토 중'}
              </div>
              <div className="text-[10px] font-bold text-blue-600 uppercase mt-1">Status: Active</div>
            </div>
            <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">인허가 대상 여부</span>
              <div className={`mt-1 text-lg font-bold ${diagnosis ? 'text-orange-600' : 'text-slate-300 italic'}`}>
                {diagnosis ? (diagnosis.verdict === DiagnosisVerdict.PERMIT ? '허가 대상' : diagnosis.verdict === DiagnosisVerdict.NOTIFICATION ? '신고 대상' : '대상 외') : '판정 대기 중'}
              </div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">
                {diagnosis ? '진단 완료' : '데이터 입력을 완료해 주세요.'}
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">리포트 생성 상태</span>
              <div className={`mt-1 text-lg font-bold ${diagnosis ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                {diagnosis ? 'DOWNLOAD READY' : 'N/A'}
              </div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">
                {diagnosis ? 'PDF 리포트 생성 완료' : '사전 검토 완료 후 활성화'}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Info Bar */}
      <footer className="flex h-10 flex-shrink-0 items-center justify-between bg-slate-800 px-8 text-[10px] text-white">
        <div className="flex gap-6">
          <span><b>환경안전 시스템 (Eco-Permit Navigator v1.0)</b></span>
          <span className="opacity-60">사업장: 한화에어로스페이스 창원사업장</span>
        </div>
        <div className="flex gap-4 opacity-60">
          <span>개인정보처리방침</span>
          <span>사용자 가이드</span>
          <span>법률 고지사항</span>
        </div>
      </footer>
    </div>
  );
}
