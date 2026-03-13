import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  Activity,
  Heart,
  Check,
  Scale,
  Ruler,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { getProfile, updateProfile, type ProfileFormData } from '../../services/profile';

const emptyProfileData: ProfileFormData = {
  age: 0,
  height: 0,
  weight: 0,
  gender: 'male',
  activity_level: 'moderate',
  preferences: '',
  food_allergies: '',
  medical_conditions: '',
};

export function WebProfile() {
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /////////////////////////////////////////////////////////////////////
  const profileId = sessionStorage.getItem('profile_id') || '2';

  const { register, handleSubmit, setValue, watch, reset } = useForm<ProfileFormData>({
    defaultValues: emptyProfileData,
  });

  const watchedValues = watch();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);

        const profile = await getProfile(profileId);

        reset({
          age: profile.age,
          height: profile.height,
          weight: profile.weight,
          gender: profile.gender,
          activity_level: profile.activity_level,
          preferences: profile.preferences ?? '',
          food_allergies: profile.food_allergies ?? '',
          medical_conditions: profile.medical_conditions ?? '',
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [profileId, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSaving(true);

      await updateProfile(profileId, {
        ...data,
        preferences: data.preferences?.trim() || '',
        food_allergies: data.food_allergies?.trim() || '',
        medical_conditions: data.medical_conditions?.trim() || '',
      });

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-sm">
          <p className="text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/web')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <h1 className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 mb-2">
          My Profile
        </h1>
        <p className="text-gray-600">
          Manage your personal information and health details
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-gradient-to-r from-[#0D7D6D] to-[#0A9B87] rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <User className="w-12 h-12" />
              </div>

              <div>
                <h2 className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-700 mb-2">
                  Welcome Back!
                </h2>
                <p className="text-white/90 text-lg mb-4">
                  Keep your profile information up to date for the best personalized experience
                </p>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {watchedValues.age || '--'} years old
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-medium capitalize">
                      {watchedValues.activity_level || '--'} Activity
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border border-white/20 min-w-[180px]">
                <p className="text-white/80 text-sm mb-2">Body Mass Index</p>
                <p className="text-5xl font-bold">
                  {watchedValues.height > 0 && watchedValues.weight > 0
                    ? (
                        watchedValues.weight /
                        ((watchedValues.height / 100) ** 2)
                      ).toFixed(1)
                    : '--'}
                </p>
                <p className="text-white/70 text-xs mt-2">BMI Score</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0D7D6D] to-[#0A9B87] flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
                  Basic Information
                </h3>
                <p className="text-xs text-gray-500">Personal details</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <Label
                  htmlFor="age-desktop"
                  className="text-sm font-semibold text-gray-700 mb-2 block"
                >
                  Age
                </Label>
                <Input
                  id="age-desktop"
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  className="h-12 text-base"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <Label
                  htmlFor="gender-desktop"
                  className="text-sm font-semibold text-gray-700 mb-2 block"
                >
                  Gender
                </Label>
                <Select
                  value={watchedValues.gender}
                  onValueChange={(value: 'male' | 'female') =>
                    setValue('gender', value)
                  }
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
                  Physical Metrics
                </h3>
                <p className="text-xs text-gray-500">Body measurements</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <Label
                  htmlFor="height-desktop"
                  className="text-sm font-semibold text-gray-700 mb-2 block"
                >
                  Height (cm)
                </Label>
                <div className="relative">
                  <Input
                    id="height-desktop"
                    type="number"
                    {...register('height', { valueAsNumber: true })}
                    className="h-12 text-base pl-11"
                    placeholder="175"
                  />
                  <Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="weight-desktop"
                  className="text-sm font-semibold text-gray-700 mb-2 block"
                >
                  Weight (kg)
                </Label>
                <div className="relative">
                  <Input
                    id="weight-desktop"
                    type="number"
                    {...register('weight', { valueAsNumber: true })}
                    className="h-12 text-base pl-11"
                    placeholder="70"
                  />
                  <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
                  Lifestyle
                </h3>
                <p className="text-xs text-gray-500">Activity preferences</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <Label
                  htmlFor="activity_level-desktop"
                  className="text-sm font-semibold text-gray-700 mb-2 block"
                >
                  Activity Level
                </Label>
                <Select
                  value={watchedValues.activity_level}
                  onValueChange={(value: 'low' | 'moderate' | 'high') =>
                    setValue('activity_level', value)
                  }
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Activity</SelectItem>
                    <SelectItem value="moderate">Moderate Activity</SelectItem>
                    <SelectItem value="high">High Activity</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Choose the level that best matches your daily routine
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
                  Fitness Preferences
                </h3>
                <p className="text-xs text-gray-500">Your interests and goals</p>
              </div>
            </div>

            <div>
              <Label
                htmlFor="preferences-desktop"
                className="text-sm font-semibold text-gray-700 mb-2 block"
              >
                Preferences
              </Label>
              <Textarea
                id="preferences-desktop"
                {...register('preferences')}
                className="min-h-[140px] resize-none text-base leading-relaxed"
                placeholder="e.g., Strength training, Running, Yoga, Cycling..."
              />
              <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                Share your fitness interests, favorite exercises, and personal goals
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
                  Health Information
                </h3>
                <p className="text-xs text-gray-500">Medical details</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <Label
                  htmlFor="food_allergies-desktop"
                  className="text-sm font-semibold text-gray-700 mb-2 block"
                >
                  Food Allergies
                </Label>
                <Textarea
                  id="food_allergies-desktop"
                  {...register('food_allergies')}
                  className="min-h-[60px] resize-none text-base"
                  placeholder="e.g., Peanuts, Shellfish, or None"
                />
              </div>

              <div>
                <Label
                  htmlFor="medical_conditions-desktop"
                  className="text-sm font-semibold text-gray-700 mb-2 block"
                >
                  Medical Conditions
                </Label>
                <Textarea
                  id="medical_conditions-desktop"
                  {...register('medical_conditions')}
                  className="min-h-[60px] resize-none text-base"
                  placeholder="e.g., Diabetes, Hypertension, or None"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 text-lg mb-1">
                Ready to save your changes?
              </h4>
              <p className="text-sm text-gray-600">
                All your information will be securely updated
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-to-r from-[#0D7D6D] to-[#0A9B87] text-white h-14 px-10 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {isSaving ? (
                <>Saving Changes...</>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}