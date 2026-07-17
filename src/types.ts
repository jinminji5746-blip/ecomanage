/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum FacilityCategory {
  AIR = 'AIR',
  WATER = 'WATER',
  CHEMICAL = 'CHEMICAL',
  NOISE = 'NOISE',
}

export enum DiagnosisVerdict {
  PERMIT = 'PERMIT', // 허가
  NOTIFICATION = 'NOTIFICATION', // 신고
  EXEMPT = 'EXEMPT', // 대상외
}

export interface EquipmentSpec {
  name: string;
  category: FacilityCategory;
  type: string; // e.g., "연소시설", "도장시설"
  capacity: number;
  unit: string;
  pollutants: string[];
}

export interface LawCriteria {
  id: string;
  category: FacilityCategory;
  facilityType: string;
  thresholdNotification: number;
  thresholdPermit: number;
  unit: string;
  description: string;
}

export interface DiagnosisResult {
  verdict: DiagnosisVerdict;
  applicableLaw: string;
  reason: string;
  requiredDocuments: string[];
}

export interface UserInput {
  facilityName: string;
  location: string;
  installationDate: string;
  equipment: EquipmentSpec;
}
