/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FacilityCategory, LawCriteria } from '../types';

export const AIR_LAW_CRITERIA: LawCriteria[] = [
  {
    id: 'air-boiler-gas',
    category: FacilityCategory.AIR,
    facilityType: '연소시설(가스/경유 보일러)',
    thresholdNotification: 0.1, // 가상 기준: 0.1톤 이상
    thresholdPermit: 2, // 가상 기준: 2톤 이상
    unit: 'T/hr',
    description: '가스 또는 경유를 사용하는 보일러 시설 (증발량 기준)',
  },
  {
    id: 'air-painting',
    category: FacilityCategory.AIR,
    facilityType: '도장시설',
    thresholdNotification: 5, // 가상 기준: 용적 5m3 이상
    thresholdPermit: 50, // 가상 기준: 용적 50m3 이상
    unit: 'm3',
    description: '유기용제를 사용하는 도장시설 (포집시설 용적 기준)',
  },
  {
    id: 'air-drying',
    category: FacilityCategory.AIR,
    facilityType: '건조시설',
    thresholdNotification: 10,
    thresholdPermit: 100,
    unit: 'm3',
    description: '열원을 사용하는 건조시설',
  }
];

export const GET_REQUIRED_DOCS = (category: FacilityCategory) => {
  switch (category) {
    case FacilityCategory.AIR:
      return [
        '대기오염물질 배출시설 설치 신고서(별지 제1호 서식)',
        '대기오염방지시설 설치 명세서',
        '배출시설 및 방지시설의 설계도서',
        '원료 사용량 및 오염물질 발생량 예측 근거 자료'
      ];
    case FacilityCategory.WATER:
      return [
        '폐수배출시설 설치 신고서',
        '폐수처리시설 설계도서',
        '수질오염물질 발생 예측 자료'
      ];
    default:
      return ['관련 법령에 따른 설치 신고서 및 증빙 서류'];
  }
};
