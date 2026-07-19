import { create } from 'zustand';

import type { Doctor, TestAdmin } from '@/lib/api/types';

interface DashboardState {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  testAdmins: TestAdmin[];
  isLoading: boolean;
}

interface DashboardActions {
  setDoctors: (doctors: Doctor[]) => void;
  addDoctor: (doctor: Doctor) => void;
  updateDoctor: (doctorId: string, updates: Partial<Doctor>) => void;
  removeDoctor: (doctorId: string) => void;
  setSelectedDoctor: (doctor: Doctor | null) => void;
  setTestAdmins: (testAdmins: TestAdmin[]) => void;
  addTestAdmin: (testAdmin: TestAdmin) => void;
  updateTestAdmin: (testAdminId: string, updates: Partial<TestAdmin>) => void;
  removeTestAdmin: (testAdminId: string) => void;
  setLoading: (loading: boolean) => void;
}

type DashboardStore = DashboardState & DashboardActions;

export const useDashboardStore = create<DashboardStore>(set => ({
  doctors: [],
  selectedDoctor: null,
  testAdmins: [],
  isLoading: false,
  setDoctors: doctors => set({ doctors }),
  addDoctor: doctor => set(state => ({ doctors: [...state.doctors, doctor] })),
  updateDoctor: (doctorId, updates) =>
    set(state => ({
      doctors: state.doctors.map(doc => (doc.id === doctorId ? { ...doc, ...updates } : doc)),
    })),
  removeDoctor: doctorId =>
    set(state => ({
      doctors: state.doctors.filter(doc => doc.id !== doctorId),
    })),
  setSelectedDoctor: doctor => set({ selectedDoctor: doctor }),
  setTestAdmins: testAdmins => set({ testAdmins }),
  addTestAdmin: testAdmin => set(state => ({ testAdmins: [...state.testAdmins, testAdmin] })),
  updateTestAdmin: (testAdminId, updates) =>
    set(state => ({
      testAdmins: state.testAdmins.map(ta => (ta.id === testAdminId ? { ...ta, ...updates } : ta)),
    })),
  removeTestAdmin: testAdminId =>
    set(state => ({
      testAdmins: state.testAdmins.filter(ta => ta.id !== testAdminId),
    })),
  setLoading: isLoading => set({ isLoading }),
}));

export const selectDoctorById = (doctorId: string) =>
  useDashboardStore.getState().doctors.find(doc => doc.id === doctorId);

export const useDoctorById = (doctorId: string) =>
  useDashboardStore(state => state.doctors.find(doc => doc.id === doctorId));

export const selectTestAdminById = (testAdminId: string) =>
  useDashboardStore.getState().testAdmins.find(ta => ta.id === testAdminId);

export const useTestAdminById = (testAdminId: string) =>
  useDashboardStore(state => state.testAdmins.find(ta => ta.id === testAdminId));
