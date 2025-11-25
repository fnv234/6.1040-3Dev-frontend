import { ref, watch, computed } from 'vue';
import type { Team } from '@/types';
import { useAuthStore } from './auth';

const teams = ref<Team[]>([]);

export function useTeamsStore() {
  const auth = useAuthStore();
  const currentAdminId = computed(() => auth.currentAdmin.value?._id);

  const storageKey = computed(() => {
    if (currentAdminId.value) {
      return `hrTeams_${currentAdminId.value}`;
    }
    return null;
  });

  function loadTeamsForCurrentUser() {
    if (storageKey.value) {
      const raw = localStorage.getItem(storageKey.value);
      try {
        teams.value = raw ? (JSON.parse(raw) as Team[]) : [];
      } catch {
        teams.value = [];
      }
    } else {
      teams.value = [];
    }
  }

  watch(currentAdminId, loadTeamsForCurrentUser, { immediate: true });

  watch(
    teams,
    (newTeams) => {
      if (storageKey.value) {
        localStorage.setItem(storageKey.value, JSON.stringify(newTeams));
      }
    },
    { deep: true }
  );

  function createTeam(name: string, memberEmails: string[]): Team {
    const team: Team = {
      _id: `temp_team_${Date.now()}`,
      name,
      members: memberEmails,
    };
    teams.value.push(team);
    return team;
  }

  function updateTeam(updated: Team) {
    const index = teams.value.findIndex((t) => t._id === updated._id);
    if (index !== -1) {
      teams.value[index] = { ...updated };
    }
  }

  function deleteTeam(id: string) {
    teams.value = teams.value.filter((t) => t._id !== id);
  }

  return {
    teams,
    createTeam,
    updateTeam,
    deleteTeam,
  };
}
