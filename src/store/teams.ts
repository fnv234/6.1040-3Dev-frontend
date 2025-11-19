import { ref, watchEffect } from 'vue';
import type { Team } from '@/types';

const STORAGE_KEY = 'hrTeams';

function loadTeams(): Team[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Team[];
  } catch {
    return [];
  }
}

const teams = ref<Team[]>(loadTeams());

watchEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams.value));
});

export function useTeamsStore() {
  function createTeam(name: string, memberEmails: string[]): Team {
    const team: Team = {
      id: `team_${Date.now()}`,
      name,
      memberEmails,
      createdAt: new Date().toISOString()
    };
    teams.value.push(team);
    return team;
  }

  function updateTeam(updated: Team) {
    const index = teams.value.findIndex(t => t.id === updated.id);
    if (index !== -1) {
      teams.value[index] = { ...updated };
    }
  }

  function deleteTeam(id: string) {
    teams.value = teams.value.filter(t => t.id !== id);
  }

  return {
    teams,
    createTeam,
    updateTeam,
    deleteTeam
  };
}
