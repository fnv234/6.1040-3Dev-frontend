<template>
  <div class="container">
    <div class="page-header">
      <h1>Team Management</h1>
      <GradientButton @click="showCreateModal = true">+ Create Team</GradientButton>
    </div>

    <div class="org-upload card">
      <h2>Upload Org Chart</h2>
      <p class="text-sconst closeModal = () => {
  showCreateModal.value = false;
  editingTeam.value = null;
  formData.value = { name: '', members: [], membersWithRoles: [] };
};ary">
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
          <h4>Team Members</h4>
          <div v-if="team.membersWithRoles && team.membersWithRoles.length > 0">
            <ul class="member-list-with-roles">
              <li v-for="(member, idx) in team.membersWithRoles" :key="idx" class="member-with-role">
                <div class="member-info">
                  <span class="member-id">{{ member.memberId }}</span>
                  <span class="member-role">{{ member.role }}</span>
                </div>
                <span class="member-email">{{ member.email }}</span>
              </li>
            </ul>
          </div>
          <div v-else-if="team.members && team.members.length > 0">
            <ul class="member-list">
              <li v-for="(memberId, idx) in team.members" :key="idx">
                {{ memberId }}
              </li>
            </ul>
          </div>
          <div v-else>
            <p class="text-secondary">No members added yet</p>
          </div>
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
            <label class="label" for="teamEmail">Team Email (Optional)</label>
            <input
              id="teamEmail"
              v-model="formData.email"
              type="email"
              class="input"
              placeholder="e.g., engineering@company.com"
            />
          </div>
          
          <div class="form-group">
            <label class="label">Team Members with Roles</label>
            <div class="members-with-roles-section">
              <div v-if="formData.membersWithRoles.length === 0" class="empty-members">
                <p class="text-secondary">No members added yet.</p>
              </div>
              <div v-else class="members-list">
                <div v-for="(member, idx) in formData.membersWithRoles" :key="idx" class="member-row">
                  <div class="member-inputs">
                    <input
                      v-model="member.memberId"
                      type="text"
                      class="input member-id-input"
                      placeholder="Employee ID (e.g., emp001)"
                      required
                    />
                    <input
                      v-model="member.role"
                      type="text"
                      class="input member-role-input"
                      placeholder="Role (e.g., manager, team lead)"
                      required
                    />
                    <input
                      v-model="member.email"
                      type="email"
                      class="input member-email-input"
                      placeholder="Email (e.g., emp001@company.com)"
                      required
                    />
                  </div>
                  <button @click="removeMemberWithRole(idx)" class="btn-remove" type="button">
                    Remove
                  </button>
                </div>
              </div>
              <GradientButton @click="addMemberWithRole" type="button" variant="variant">
                + Add Member
              </GradientButton>
            </div>
          </div>

          <div class="form-group">
            <label class="label" for="memberIds">Or add Member IDs (one per line) - legacy method</label>
            <textarea
              id="memberIds"
              v-model="memberIdsText"
              class="input textarea"
              rows="4"
              placeholder="emp001&#10;emp002&#10;emp003"
            ></textarea>
            <small class="text-secondary">Use this for quick entry without roles. Members with roles take priority.</small>
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
import { useAuthStore } from '@/store/auth';
import GradientButton from '@/components/ui/GradientButton.vue';
import { orgGraph } from '@/api/client';

const auth = useAuthStore();
const currentAdminId = computed(() => auth.currentAdmin.value?._id);

const { teams, createTeamWithRoles, updateTeam, deleteTeam: deleteTeamFromStore, loadTeamsFromBackend } = useTeamsStore();
const showCreateModal = ref(false);
const editingTeam = ref<Team | null>(null);

const formData = ref({
  name: '',
  email: '',
  members: [] as string[],
  membersWithRoles: [] as Array<{memberId: string, role: string, email: string}>
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

const addMemberWithRole = () => {
  formData.value.membersWithRoles.push({ memberId: '', role: '', email: '' });
};

const removeMemberWithRole = (index: number) => {
  formData.value.membersWithRoles.splice(index, 1);
};

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
      const transformedEmployees = parsed.employees.map((emp: { id: string; email?: string; manager?: string; teamName?: string; role?: string }) => ({
        id: emp.id,
        email: emp.email || `${emp.id}@example.com`, // Default email if not provided
        manager: emp.manager,
        teamNames: emp.teamName ? [emp.teamName] : [], // Convert teamName to teamNames array
        role: emp.role,
      }));
      
      const response = await orgGraph.importRoster({ 
        owner: currentAdminId.value ?? undefined,
        sourceData: { 
          employees: transformedEmployees 
        } 
      });
      console.log('Import response:', response);
      // After a successful import, refresh teams from the backend so the UI reflects the new structure
      await loadTeamsFromBackend();
      orgStatus.value = 'Org chart imported successfully. Teams have been updated.';
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
  formData.value = { name: '', email: '', members: [], membersWithRoles: [] };
};

const editTeam = (team: Team) => {
  editingTeam.value = team;
  formData.value = {
    name: team.name,
    email: (team as any).email || '',
    members: [...team.members],
    membersWithRoles: team.membersWithRoles ? [...team.membersWithRoles] : []
  };
  showCreateModal.value = true;
};

const saveTeam = async () => {
  // Combine members with roles and legacy members list
  const allMembers = [
    ...formData.value.membersWithRoles.map(m => m.memberId),
    ...formData.value.members
  ].filter(id => id.trim() !== '');
  
  // Remove duplicates
  const uniqueMembers = [...new Set(allMembers)];
  
  if (editingTeam.value) {
    const updated: Team = {
      ...editingTeam.value,
      name: formData.value.name,
      members: uniqueMembers,
      membersWithRoles: formData.value.membersWithRoles.filter(m => m.memberId.trim() !== '' && m.role.trim() !== '' && m.email.trim() !== '')
    };
    updateTeam(updated);
  } else {
    createTeamWithRoles(
      formData.value.name, 
      uniqueMembers, 
      formData.value.membersWithRoles.filter(m => m.memberId.trim() !== '' && m.role.trim() !== '' && m.email.trim() !== '')
    );
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

.team-email {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
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

.members-with-roles-section {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  background: white;
}

.empty-members {
  text-align: center;
  padding: 1rem;
  color: var(--text-secondary);
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
}

.member-inputs {
  display: flex;
  gap: 0.5rem;
  flex: 1;
}

.member-id-input {
  flex: 1;
  min-width: 0;
}

.member-role-input {
  flex: 1;
  min-width: 0;
}

.member-email-input {
  flex: 1;
  min-width: 0;
}

.btn-remove {
  background: var(--error);
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.btn-remove:hover {
  background: var(--error-dark, #d32f2f);
}

.member-list-with-roles {
  list-style: none;
  padding: 0;
  margin: 0;
}

.member-with-role {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
}

.member-with-role:last-child {
  border-bottom: none;
}

.member-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.member-id {
  font-weight: 600;
  color: var(--text-primary);
}

.member-role {
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.member-email {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-style: italic;
}
</style>
