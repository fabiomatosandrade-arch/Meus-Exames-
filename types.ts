
export interface User {
  id: string;
  name: string;
  birthDate: string;
  email: string;
  preExistingConditions: string;
  continuousMedications?: string;
  username: string;
  bloodType?: string;
  photoUrl?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  crm?: string;
  phone?: string;
  address?: string;
}

export interface Laboratory {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface ExamReference {
  code: string;
  name: string;
  referenceValue: string;
  unit: string;
}

export interface ExamRecord {
  id: string;
  examName: string;
  value: string;
  unit: string;
  referenceRange: string;
  laboratory: string;
  doctorName: string;
  date: string;
  notes?: string;
}

export interface ImagingExam {
  id: string;
  patientName?: string;
  examType: string;
  region: string;
  doctorName: string;
  laboratory: string;
  date: string;
  reportSummary: string;
  conclusion: string;
  notes?: string;
  fileUri?: string;
  fileMimeType?: string;
}

export interface Appointment {
  id: string;
  title: string;
  type: 'CONSULTA' | 'EXAME';
  date: string;
  time: string;
  location: string;
  address?: string;
  notes?: string;
  notified: boolean;
}

// Fixed missing Reminder interface to support the Reminders component
export interface Reminder {
  id: string;
  examName: string;
  frequencyMonths: number;
  lastDate: string;
  nextDate: string;
  notes?: string;
  active: boolean;
}

export enum AppScreen {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  DASHBOARD = 'DASHBOARD',
  PROFILE = 'PROFILE',
  EXAMS = 'EXAMS',
  IMAGING_EXAMS = 'IMAGING_EXAMS',
  DOCTORS = 'DOCTORS',
  LABORATORIES = 'LABORATORIES',
  REPORTS = 'REPORTS',
  ANALYTICS = 'ANALYTICS',
  AGENDA = 'AGENDA'
}
