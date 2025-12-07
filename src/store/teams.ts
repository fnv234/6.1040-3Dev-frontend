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
  watch(currentAdminId, async (newAdminId: string | undefined) => {
    if (newAdminId) {
      await loadTeamsFromBackend();
    } else {
      teams.value = [];
      loaded.value = false;
    }
  }, { immediate: true });

  async function loadTeamsFromBackend() {
    if (loading.value) {
      return;
    }
    
    loading.value = true;
    try {
      const response = await orgGraph.getAllTeams({ owner: currentAdminId.value ?? undefined });
      
      // Transform backend response to match our Team type
      teams.value = response.data.teams.map((team: any) => ({
        _id: team._id,
        name: team.name,
        owner: team.owner || currentAdminId.value,
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
        members: memberEmails,
        owner: currentAdminId.value ?? undefined
      });

      const team: Team = {
        _id: response.data.team,
        name,
        owner: currentAdminId.value ?? '',
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
        owner: currentAdminId.value ?? '',
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
        membersWithRoles,
        owner: currentAdminId.value ?? undefined
      });

      const team: Team = {
        _id: response.data.team,
        name,
        owner: currentAdminId.value ?? '',
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
        owner: currentAdminId.value ?? '',
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
    try {
      // Update in backend first
      await orgGraph.updateTeamInfo({
        teamId: updated._id,
        updates: {
          name: updated.name,
          members: updated.members,
          membersWithRoles: updated.membersWithRoles
        },
        owner: currentAdminId.value ?? undefined
      });

      // Update local state after successful backend update
      const index = teams.value.findIndex((t: Team) => t._id === updated._id);
      if (index !== -1) {
        teams.value[index] = { ...updated };
        
        // Update localStorage cache
        const storageKey = `hrTeams_${currentAdminId.value}`;
        localStorage.setItem(storageKey, JSON.stringify(teams.value));
      }
    } catch (error) {
      console.error('Error updating team in backend:', error);
      // On failure, reload from backend to resync state
      await loadTeamsFromBackend();
      throw error; // Re-throw to let the UI handle the error
    }
  }

  async function deleteTeam(id: string) {
    // Remove locally first for instant UI feedback
    teams.value = teams.value.filter((t: Team) => t._id !== id);
    const storageKey = `hrTeams_${currentAdminId.value}`;
    localStorage.setItem(storageKey, JSON.stringify(teams.value));

    // Persist deletion to backend (scoped by current admin if available)
    try {
      await orgGraph.deleteTeam({ teamId: id, owner: currentAdminId.value ?? undefined });
    } catch (error) {
      console.error('Error deleting team in backend:', error);
      // On failure, reload from backend to resync state
      await loadTeamsFromBackend();
    }
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