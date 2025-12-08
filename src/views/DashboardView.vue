<template>
  <div class="container">
    <div class="dashboard-header">
      <h1>Feedback Dashboard</h1>
      <p class="text-secondary">Overview of team feedback responses and statistics</p>
    </div>

    <div v-if="loading" class="loading">Loading dashboard data...</div>

    <div v-else>
      <!-- Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card card">
          <h3>Active Teams</h3>
          <p class="stat-value">{{ stats.activeTeams }}</p>
        </div>
        <div class="stat-card card">
          <h3>Total Forms Sent</h3>
          <p class="stat-value">{{ stats.totalForms }}</p>
        </div>
        <div class="stat-card card">
          <h3>Total Responses Across All Forms</h3>
          <p class="stat-value">{{ stats.totalResponses }}</p>
        </div>
        <div class="stat-card card">
        <h3>Total Completed Forms</h3>
        <p class="stat-value">{{ stats.completedForms }}</p>
      </div>
      </div>
      

      <!-- Response Rate Chart -->
      <div v-if="chartData.labels.length > 0" class="section">
        <div class="card">
          <h2>Top Forms by Response Rate</h2>
          <p>A maximum of 3 forms will be displayed at once. </p>
          <div class="chart-container">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>
      </div>

      

    <div class="dashboard-header">
      <h1>Resource Guide for Administrators: How To Use 360Feedback</h1>
      <h3>1. Create a Team</h3>
      <p>You will need each team members ID, role, and email. You can enter details manually or import a JSON file with the instructed format. </p>
      <h3>2. Create a Form</h3>
      <p>Enter a variety of questions and designate the desired answer format as well as any role-sepcific questions. Save this form. </p>
      <h3>3. Send the Form</h3>
      <p>Email the form to all members of the team. They will receive unique passwords to access the form. All responses will be located in the Responses tab. </p>
      <h3>4. Synthesize a Report</h3>
      <p>Once at least 3 people on the team have responded, synthesize a report based on their answers with a single click! You will also have the option to email the response back to the team members or feel free to communicate the feedback directly. </p>
      
      
       
    </div>

    <div class="dashboard-header">
      <h1>FAQ</h1>
      <h3 class="text-secondary">Do employees need to create accounts with 360Feedback to submit and receive feedback?</h3>
      <p>No. Employees will receive unique access codes in their email to use. Only the administrator needs a 360Feedback account. </p>
      <br>
    <h3 class="text-secondary">Is user feedback anonymous? </h3>
      <p>Feedback is not anonymous to administrators, but it is to the AI engine used to facilitate report synthesis. If a user is uncomfortable answering a question, they can leave it blank. </p>
    
      <br>
      <h3 class="text-secondary">What is the purpose of this application?</h3>
      <p>Team development. See <a href="https://en.wikipedia.org/wiki/360-degree_feedback">here</a> for insight. </p>
    
    </div>
     
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue';
import { useTeamsStore } from '@/store/teams';
import { useFormsStore } from '@/store/forms';
import Chart from 'chart.js/auto';

const { teams } = useTeamsStore();
const formsStore = useFormsStore();
const { forms } = formsStore;

const loading = ref(true);
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

// Store form response counts
const formResponseCounts = ref<Record<string, number>>({});

// const teamStats = computed<TeamStatistics[]>(() => {
//   return teams.value.map(team => {
//     // Calculate real statistics from AccessCode form responses
//     const teamForms = forms.value.filter(f => f.teamId === team._id);
    
//     // Count actual AccessCode responses for team forms
//     const totalResponses = teamForms.reduce((sum, form) => {
//       return sum + (formResponseCounts.value[form._id || ''] || 0);
//     }, 0);
    
//     // Calculate response rate based on team size
//     const teamSize = team.members?.length || 0;
//     const responseRate = teamSize > 0 && teamForms.length > 0
//       ? Math.round((totalResponses / (teamForms.length * teamSize)) * 100)
//       : 0;

//     return {
//       teamId: team._id,
//       teamName: team.name,
//       totalResponses,
//       responseRate: Math.min(100, responseRate), // Cap at 100%
//       averageComfortLevel: totalResponses > 0 ? 4.2 : undefined, // Mock - integrate with real data
//       sentimentSummary: totalResponses > 0 
//         ? 'Team members report positive collaboration and clear communication. Areas for improvement include project planning and resource allocation.'
//         : undefined
//     };
//   });
// });

const stats = computed(() => {
  const totalForms = forms.value.length;
  
  // Count total actual AccessCode responses across all forms
  const totalResponses = Object.values(formResponseCounts.value).reduce((sum, count) => sum + count, 0);
  
  // Calculate total expected responses (forms * team members)
  const totalExpectedResponses = forms.value.reduce((sum, form) => {
    const team = teams.value.find(t => t._id === form.teamId);
    const teamSize = team?.members?.length || 0;
    return sum + teamSize;
  }, 0);
  
  const activeTeams = teams.value.length;
  const responseRate = totalExpectedResponses > 0 
    ? Math.round((totalResponses / totalExpectedResponses) * 100) 
    : 0;

  const completedForms = forms.value.reduce((acc, form) => {
    const team = teams.value.find(t => t._id === form.teamId);
    const teamSize = team?.members?.length || 0;
    const responses = form._id ? (formResponseCounts.value[form._id] || 0) : 0;
    // consider a form "completed" when responses meet or exceed team size (guard teamSize > 0)
    return acc + (teamSize > 0 && responses >= teamSize ? 1 : 0);
  }, 0);

  return {
    totalForms,
    totalResponses,
    completedForms, 
    responseRate: Math.min(100, responseRate), // Cap at 100%
    activeTeams
  };
});

const chartData = computed(() => {
  // Get forms with responses, calculate their response rates, and sort by response count
  const formsWithData = forms.value
    .filter(form => form._id && formResponseCounts.value[form._id] > 0)
    .map(form => {
      const team = teams.value.find(t => t._id === form.teamId);
      const teamSize = team?.members?.length || 0;
      const responses = form._id ? (formResponseCounts.value[form._id] || 0) : 0;
      const responseRate = teamSize > 0 ? Math.round((responses / teamSize) * 100) : 0;
      
      return {
        name: form.name,
        responses,
        responseRate: Math.min(100, responseRate), // Cap at 100%
        teamName: team?.name || 'Unknown Team'
      };
    })
    .sort((a, b) => b.responses - a.responses) // Sort by response count descending
    .slice(0, 3); // Take top 3
  
  const labels = formsWithData.map(f => `${f.name} (${f.teamName})`);
  const data = formsWithData.map(f => f.responseRate);
  
  return { labels, data };
});

const initChart = () => {
  if (!chartCanvas.value || chartData.value.labels.length === 0) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: chartData.value.labels,
      datasets: [{
        label: 'Response Rate (%)',
        data: chartData.value.data,
        backgroundColor: 'rgba(108, 222, 247, 0.7)',
        borderColor: 'rgba(66, 122, 161, 1)',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => value + '%'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
};

const loadFormResponseCounts = async () => {
  const counts: Record<string, number> = {};
  
  for (const form of forms.value) {
    if (form._id) {
      try {
        const responses = await formsStore.getFormResponses(form._id);
        counts[form._id] = responses.length;
      } catch (error) {
        // If we can't load responses for a form, assume it has 0 responses
        counts[form._id] = 0;
      }
    }
  }
  
  formResponseCounts.value = counts;
};

onMounted(async () => {
  try {
    // Wait for forms to be loaded (watch in store loads them automatically)
    let attempts = 0;
    while (!formsStore.loaded.value && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // Now load response counts
    await loadFormResponseCounts();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    loading.value = false;
    nextTick(() => {
      initChart();
    });
  }
});
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  color: var(--title-primary);
  text-shadow: 1px 1px var(--primary);
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  text-align: center;
  background: rgba(252, 248, 248, 0.93);
  border-radius: 12px;
  border: 1px solid rgba(103, 88, 74, 0.5);
}

.stat-card h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
}

.chart-container {
  height: 300px;
  padding: 1rem 0;
}

.section {
  margin-bottom: 2rem;
}

.section h2 {
  color: var(--title-primary);
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: rgba(222, 246, 255, 0.45);
  border-radius: 12px;
  border: 1px solid rgba(103, 88, 74, 0.5);
}

.empty-state .btn {
  margin-top: 1rem;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-card {
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(103, 88, 74, 0.5);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.team-header h3 {
  margin: 0;
}

.badge {
  background: var(--primary);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  color: white;
}

.team-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  gap: 0.5rem;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.stat-value-inline {
  font-weight: 600;
}

.sentiment-summary {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(103, 88, 74, 0.5);
}

.sentiment-summary h4 {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.sentiment-summary p {
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.btn-sm {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.action-card {
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  border-radius: 12px;
  border: 1px solid rgba(103, 88, 74, 0.5);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  border-color: rgba(108, 222, 247, 0.7);
}

.action-card h3 {
  margin-bottom: 0.5rem;
}
</style>