<template>
  <div class="container">
    <div class="page-header">
      <h1>Team Management</h1>
      <GradientButton @click="showCreateModal = true">+ Create Team</GradientButton>
    </div>

    <div class="org-upload card">
      <h2>Upload Org Chart</h2>
      <p class="text-secondary">
        Upload a JSON file with your employee roster to let OrgGraph infer team hierarchies.
        Expected format:
        <code>{ "employees": [{ "id": "emp001", "manager": "mgr001", "teamName": "Engineering" }, ...] }</code>
      </p>
      <div class="org-upload-controls">
        <input type="file" accept="application/json" @change="onOrgFileSelected" />
        <GradientButton :disabled="!orgFile || orgUploading" @click="importOrgChart">
          {{ orgUploading ? 'Importing…' : 'Import Org Chart' }}
        </GradientButton>
      </div>
      <p v-if="orgStatus" class="org-status" :class="{ 'org-status-error': orgStatusType === 'error', 'org-status-success': orgStatusType === 'success' }">
        {{ orgStatus }}
      </p>
    </div>

    <div v-if="teams.length === 0" class="empty-state card">
      <h3>No teams yet</h3>
      <p class="text-secondary">Create your first team to start sending feedback forms</p>
      <GradientButton @click="showCreateModal = true">Create Team</GradientButton>
    </div>

    <div v-else class="teams-list">
      <div v-for="team in teams" :key="team._id" class="team-card card">
        <div class="team-info">
          <h3>{{ team.name }}</h3>
          <p class="text-secondary">{{ team.members.length }} members</p>
        </div>
        <div class="team-members">
          <h4>Team Members (Employee IDs)</h4>
          <ul class="member-list">
            <li v-for="(memberId, idx) in team.members" :key="idx">
              {{ memberId }}
            </li>
          </ul>
        </div>
        <div class="team-actions">
          <GradientButton @click="editTeam(team)" variant="variant">Edit</GradientButton>
          <GradientButton @click="deleteTeam(team._id)" variant="variant">Delete</GradientButton>
        </div>
      </div>
    </div>

    <!-- Create/Edit Team Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal card">
        <h2>{{ editingTeam ? 'Edit Team' : 'Create New Team' }}</h2>
        <form @submit.prevent="saveTeam">
          <div class="form-group">
            <label class="label" for="teamName">Team Name</label>
            <input
              id="teamName"
              v-model="formData.name"
              type="text"
              class="input"
              placeholder="e.g., Engineering Team"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="label" for="memberIds">Member IDs (one per line)</label>
            <textarea
              id="memberIds"
              v-model="memberIdsText"
              class="input textarea"
              rows="6"
              placeholder="emp001&#10;emp002&#10;emp003"
              required
            ></textarea>
            <small class="text-secondary">Enter one employee ID per line</small>
          </div>

          <div class="modal-actions">
            <GradientButton type="button" @click="closeModal" variant="variant">Cancel</GradientButton>
            <GradientButton type="submit">
              {{ editingTeam ? 'Update Team' : 'Create Team' }}
            </GradientButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Team } from '@/types';
import { useTeamsStore } from '@/store/teams';
import GradientButton from '@/components/ui/GradientButton.vue';
import { orgGraph } from '@/api/client';

const { teams, createTeam, updateTeam, deleteTeam: deleteTeamFromStore } = useTeamsStore();
const showCreateModal = ref(false);
const editingTeam = ref<Team | null>(null);

const formData = ref({
  name: '',
  members: [] as string[]
});

const memberIdsText = computed({
  get: () => formData.value.members.join('\n'),
  set: (value: string) => {
    formData.value.members = value
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0);
  }
});

const orgFile = ref<File | null>(null);
const orgUploading = ref(false);
const orgStatus = ref('');
const orgStatusType = ref<'success' | 'error' | ''>('');

const onOrgFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] || null;
  orgFile.value = file;
  orgStatus.value = '';
  orgStatusType.value = '';
};

const importOrgChart = () => {
  if (!orgFile.value) return;
  orgUploading.value = true;
  orgStatus.value = '';
  orgStatusType.value = '';

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const text = reader.result as string;
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.employees)) {
        throw new Error('Invalid file format: expected { "employees": [...] }');
      }
      // Transform the data to match the backend's expected format
      const transformedEmployees = parsed.employees.map((emp: { id: string; email?: string; manager?: string; teamName?: string }) => ({
        id: emp.id,
        email: emp.email || `${emp.id}@example.com`, // Default email if not provided
        manager: emp.manager,
        teamNames: emp.teamName ? [emp.teamName] : [] // Convert teamName to teamNames array
      }));
      
      const response = await orgGraph.importRoster({ 
        sourceData: { 
          employees: transformedEmployees 
        } 
      });
      console.log('Import response:', response);
      orgStatus.value = 'Org chart imported successfully.';
      orgStatusType.value = 'success';
    } catch (e: any) {
      console.error('Error importing org chart:', e);
      if (e.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Full error response:', e.response);
        console.error('Request config:', e.config);
      
        // Try to get more detailed error message
        let errorMessage = 'Failed to import org chart';
        if (e.response?.data) {
          if (typeof e.response.data === 'string') {
            errorMessage = e.response.data;
          } else if (e.response.data.message) {
            errorMessage = e.response.data.message;
          } else if (e.response.data.error) {
            errorMessage = e.response.data.error;
          } else {
            errorMessage = JSON.stringify(e.response.data);
          }
        }
        orgStatus.value = `Error ${e.response.status}: ${errorMessage}`;
      } else if (e.request) {
        // The request was made but no response was received
        console.error('No response received:', e.request);
        orgStatus.value = 'No response from server. Please try again.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', e.message);
        orgStatus.value = e.message || 'Failed to import org chart.';
      }
      orgStatusType.value = 'error';
    } finally {
      orgUploading.value = false;
    }
  };
  reader.onerror = () => {
    orgUploading.value = false;
    orgStatus.value = 'Could not read file.';
    orgStatusType.value = 'error';
  };
  reader.readAsText(orgFile.value);
};

const closeModal = () => {
  showCreateModal.value = false;
  editingTeam.value = null;
  formData.value = { name: '', members: [] };
};

const editTeam = (team: Team) => {
  editingTeam.value = team;
  formData.value = {
    name: team.name,
    members: [...team.members]
  };
  showCreateModal.value = true;
};

const saveTeam = async () => {
  if (editingTeam.value) {
    const updated: Team = {
      ...editingTeam.value,
      name: formData.value.name,
      members: formData.value.members
    };
    updateTeam(updated);
  } else {
    createTeam(formData.value.name, formData.value.members);
  }

  closeModal();
};

const deleteTeam = (teamId: string) => {
  if (confirm('Are you sure you want to delete this team?')) {
    deleteTeamFromStore(teamId);
  }
};
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.org-upload {
  margin-bottom: 2rem;
}

.org-upload h2 {
  margin-bottom: 0.5rem;
}

.org-upload-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-top: 1rem;
}

.org-status {
  margin-top: 0.75rem;
  font-size: 0.875rem;
}

.org-status-success {
  color: var(--success);
}

.org-status-error {
  color: var(--error);
}

.page-header h1 {
  color: var(--title-primary);
  text-shadow: 1px 1px var(--primary);
}

.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
}

.empty-state .btn {
  margin-top: 1rem;
}

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-card {
  padding: 1.5rem;
}

.team-info {
  margin-bottom: 1rem;
}

.team-info h3 {
  margin-bottom: 0.25rem;
}

.team-members {
  margin: 1rem 0;
  padding: 1rem;
  background: white;
  border-radius: 6px;
}

.team-members h4 {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.member-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.member-list li {
  padding: 0.25rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.team-actions {
  display: flex;
  gap: 0.75rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin-bottom: 1.5rem;
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
