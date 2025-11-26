import { ref, watch, computed } from 'vue';
import type { Team, TeamMember } from '@/types';
import { useAuthStore } from './auth';
import { orgGraph } from '@/api/client';

const teams = ref<Team[]>([]);
const loading = ref(false);
const loaded = ref(false);

export function useTeamsStore() {
  const auth = useAuthStore();
  const currentAdminId = computed(() => auth.currentAdmin.value?._id);

  // Load teams from backend when admin changes
  watch(currentAdminId, async (newAdminId) => {
    if (newAdminId) {
      await loadTeamsFromBackend();
    } else {
      teams.value = [];
      loaded.value = false;
    }
  }, { immediate: true });

  async function loadTeamsFromBackend() {
    if (loading.value) return;
    
    loading.value = true;
    try {
      const response = await orgGraph.getAllTeams({ owner: currentAdminId.value ?? undefined });
      
      // Transform backend response to match our Team type
      teams.value = response.data.teams.map((team: any) => ({
        _id: team._id,
        name: team.name,
        members: team.members || [],
        membersWithRoles: team.membersWithRoles || []
      }));
      
      loaded.value = true;
      
      // Also cache in localStorage
      const storageKey = `hrTeams_${currentAdminId.value}`;
      localStorage.setItem(storageKey, JSON.stringify(teams.value));
    } catch (error) {
      console.error('Error loading teams from backend:', error);
      // Fallback to localStorage if backend fails
      loadTeamsFromLocalStorage();
    } finally {
      loading.value = false;
    }
  }

  function loadTeamsFromLocalStorage() {
    const storageKey = `hrTeams_${currentAdminId.value}`;
    const raw = localStorage.getItem(storageKey);
    try {
      teams.value = raw ? (JSON.parse(raw) as Team[]) : [];
      loaded.value = true;
    } catch {
      teams.value = [];
      loaded.value = true;
    }
  }

  async function createTeam(name: string, memberEmails: string[]): Promise<Team> {
    try {
      // Create team in backend via OrgGraph
      const response = await orgGraph.createTeam({
        name,
        members: memberEmails
      });

      const team: Team = {
        _id: response.data.team,
        name,
        members: memberEmails,
      };
      
      teams.value.push(team);
      
      // Update localStorage cache
      const storageKey = `hrTeams_${currentAdminId.value}`;
      localStorage.setItem(storageKey, JSON.stringify(teams.value));
      
      return team;
    } catch (error) {
      console.error('Error creating team in backend:', error);
      
      // Fallback to local creation
      const team: Team = {
        _id: `temp_team_${Date.now()}`,
        name,
        members: memberEmails,
      };
      teams.value.push(team);
      
      const storageKey = `hrTeams_${currentAdminId.value}`;
      localStorage.setItem(storageKey, JSON.stringify(teams.value));
      
      return team;
    }
  }

  async function createTeamWithRoles(
    name: string, 
    memberEmails: string[], 
    membersWithRoles: TeamMember[]
  ): Promise<Team> {
    try {
      // Create team in backend
      const response = await orgGraph.createTeamWithRoles({
        name,
        members: memberEmails,
        membersWithRoles
      });

      const team: Team = {
        _id: response.data.team,
        name,
        members: memberEmails,
        membersWithRoles,
      };
      
      teams.value.push(team);
      
      // Update localStorage cache
      const storageKey = `hrTeams_${currentAdminId.value}`;
      localStorage.setItem(storageKey, JSON.stringify(teams.value));
      
      return team;
    } catch (error) {
      console.error('Error creating team with roles in backend:', error);
      
      // Fallback to local creation
      const team: Team = {
        _id: `temp_team_${Date.now()}`,
        name,
        members: memberEmails,
        membersWithRoles,
      };
      teams.value.push(team);
      
      const storageKey = `hrTeams_${currentAdminId.value}`;
      localStorage.setItem(storageKey, JSON.stringify(teams.value));
      
      return team;
    }
  }

  async function updateTeam(updated: Team) {
    const index = teams.value.findIndex((t) => t._id === updated._id);
    if (index !== -1) {
      teams.value[index] = { ...updated };
      
      // Update localStorage cache
      const storageKey = `hrTeams_${currentAdminId.value}`;
      localStorage.setItem(storageKey, JSON.stringify(teams.value));
      
      // TODO: Add backend update call when API endpoint is available
      // await orgGraph.updateTeam({ teamId: updated._id, updates: updated });
    }
  }

  async function deleteTeam(id: string) {
    teams.value = teams.value.filter((t) => t._id !== id);
    
    // Update localStorage cache
    const storageKey = `hrTeams_${currentAdminId.value}`;
    localStorage.setItem(storageKey, JSON.stringify(teams.value));
    
    // TODO: Add backend delete call when API endpoint is available
    // await orgGraph.deleteTeam({ teamId: id });
  }

  return {
    teams,
    loading,
    loaded,
    createTeam,
    createTeamWithRoles,
    updateTeam,
    deleteTeam,
    loadTeamsFromBackend,
  };
}