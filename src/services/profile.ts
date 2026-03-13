import api from './api';

export interface ProfileFormData {
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female';
  activity_level: 'low' | 'moderate' | 'high';
  preferences: string;
  food_allergies: string;
  medical_conditions: string;
}

export interface ProfileApiResponse extends ProfileFormData {
  id: number;
  user_id: number;
}

export const getProfile = async (profileId: number | string) => {
  const response = await api.get<ProfileApiResponse>(`/profile/${profileId}`);
  return response.data;
};

export const updateProfile = async (
  profileId: number | string,
  data: ProfileFormData
) => {
  const response = await api.put(`/profile/${profileId}`, data);
  return response.data;
};