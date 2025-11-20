<template>
  <div class="container">
    <div class="page-header">
      <h1>Team Management</h1>
      <button @click="showCreateModal = true" class="btn btn-primary">+ Create Team</button>
    </div>

    <div v-if="teams.length === 0" class="empty-state card">
      <h3>No teams yet</h3>
      <p class="text-secondary">Create your first team to start sending feedback forms</p>
      <button @click="showCreateModal = true" class="btn btn-primary">Create Team</button>
    </div>

    <div v-else class="teams-list">
      <div v-for="team in teams" :key="team.id" class="team-card card">
        <div class="team-info">
          <h3>{{ team.name }}</h3>
          <p class="text-secondary">{{ team.memberEmails.length }} members</p>
          <p class="text-secondary"><small>Created {{ formatDate(team.createdAt) }}</small></p>
        </div>
        <div class="team-members">
          <h4>Team Members</h4>
          <ul class="member-list">
            <li v-for="(email, idx) in team.memberEmails" :key="idx">
              {{ email }}
            </li>
          </ul>
        </div>
        <div class="team-actions">
          <button @click="editTeam(team)" class="btn btn-secondary">Edit</button>
          <button @click="deleteTeam(team.id)" class="btn btn-secondary">Delete</button>
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
            <label class="label" for="memberEmails">Member Emails (one per line)</label>
            <textarea
              id="memberEmails"
              v-model="memberEmailsText"
              class="input textarea"
              rows="6"
              placeholder="john@company.com&#10;jane@company.com&#10;bob@company.com"
              required
            ></textarea>
            <small class="text-secondary">Enter one email address per line</small>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">
              {{ editingTeam ? 'Update Team' : 'Create Team' }}
            </button>
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

const { teams, createTeam, updateTeam, deleteTeam: deleteTeamFromStore } = useTeamsStore();
const showCreateModal = ref(false);
const editingTeam = ref<Team | null>(null);

const formData = ref({
  name: '',
  memberEmails: [] as string[]
});

const memberEmailsText = computed({
  get: () => formData.value.memberEmails.join('\n'),
  set: (value: string) => {
    formData.value.memberEmails = value
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }
});

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString();
};

const closeModal = () => {
  showCreateModal.value = false;
  editingTeam.value = null;
  formData.value = { name: '', memberEmails: [] };
};

const editTeam = (team: Team) => {
  editingTeam.value = team;
  formData.value = {
    name: team.name,
    memberEmails: [...team.memberEmails]
  };
  showCreateModal.value = true;
};

const saveTeam = async () => {
  if (editingTeam.value) {
    const updated: Team = {
      ...editingTeam.value,
      name: formData.value.name,
      memberEmails: formData.value.memberEmails
    };
    updateTeam(updated);
  } else {
    createTeam(formData.value.name, formData.value.memberEmails);
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
