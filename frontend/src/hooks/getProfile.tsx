import { useState, useEffect } from 'react';
import api from '../apis/axios';

type ProfileUser = {
  id: string;
  username: string;
  email: string;
  cfHandle: string;
  rating: number;
  winCount: number;
  currentStreak: number;
  longestStreak: number;
  lastStreakDate?: string | null;
  streakTier?: string;
};

type StreakMeta = {
  didUpdate: boolean;
  rewardAwarded: number;
  nextMilestoneIn: number;
};

export const useProfile = () => {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [streakMeta, setStreakMeta] = useState<StreakMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await api.get('/api/auth/profile');
        setUser(response.data.user || response.data);
        setStreakMeta(response.data.streakMeta || null);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    getUserData();
  }, []);

  return { user, streakMeta, isLoading };
};