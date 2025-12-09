<template>
  <div class="container">
    <div ref="headerRef" class="dashboard-header animate-element">
      <h1 class="dashboard-title">Feedback Dashboard</h1>
      <p class="text-secondary">Overview of team feedback responses and statistics</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading dashboard data...</p>
    </div>

    <div v-else>
      <!-- Summary Cards -->
      <div ref="statsRef" class="stats-grid">
        <div class="stat-card card animate-element" v-for="(stat, index) in statsArray" :key="index" :style="{ animationDelay: `${0.1 * index}s` }">
          <div class="stat-icon">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 36" v-html="stat.icon"></svg>
          </div>
          <h3>{{ stat.label }}</h3>
          <p class="stat-value" :data-target="stat.value">0</p>
        </div>
      </div>
      

      <!-- Response Rate Chart -->
      <div ref="chartRef" v-if="chartData.labels.length > 0" class="section animate-element">
        <div class="card">
          <h2>Top Forms by Response Rate</h2>
          <p>A maximum of 3 forms will be displayed at once.</p>
          <div class="chart-container">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>
      </div>

      

      <div ref="guideRef" class="dashboard-header animate-element">
        <h1 class="dashboard-title">Resource Guide for Administrators</h1>
        <p class="dashboard-subtitle">How To Use 360Feedback</p>
        <div class="guide-steps">
          <div class="step-card animate-element" v-for="(step, index) in guideSteps" :key="index" :style="{ animationDelay: `${0.1 * index}s` }">
            <div class="step-number">{{ step.number }}</div>
            <div class="step-content">
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div ref="faqRef" class="dashboard-header animate-element">
        <h1 class="dashboard-title">Frequently Asked Questions</h1>
        <div class="faq-list">
          <div class="faq-item animate-element" v-for="(faq, index) in faqs" :key="index" :style="{ animationDelay: `${0.1 * index}s` }">
            <h3 class="faq-question">{{ faq.question }}</h3>
            <p class="faq-answer" v-html="faq.answer"></p>
          </div>
        </div>
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

// Refs for animations
const headerRef = ref<HTMLElement>();
const statsRef = ref<HTMLElement>();
const chartRef = ref<HTMLElement>();
const guideRef = ref<HTMLElement>();
const faqRef = ref<HTMLElement>();

// Store form response counts
const formResponseCounts = ref<Record<string, number>>({});

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
    return acc + (teamSize > 0 && responses >= teamSize ? 1 : 0);
  }, 0);

  return {
    totalForms,
    totalResponses,
    completedForms, 
    responseRate: Math.min(100, responseRate),
    activeTeams
  };
});

const statsArray = computed(() => [
  {
    label: 'Active Teams',
    value: stats.value.activeTeams,
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>'
  },
  {
    label: 'Total Forms Sent',
    value: stats.value.totalForms,
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>'
  },
  {
    label: 'Total Responses',
    value: stats.value.totalResponses,
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>'
  },
  {
    label: 'Completed Forms',
    value: stats.value.completedForms,
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
  }
]);

const guideSteps = [
  {
    number: 1,
    title: 'Create a Team',
    description: 'You will need each team member\'s ID, role, and email. You can enter details manually or import a JSON file with the instructed format.'
  },
  {
    number: 2,
    title: 'Create a Form',
    description: 'Enter a variety of questions and designate the desired answer format as well as any role-specific questions. Save this form.'
  },
  {
    number: 3,
    title: 'Send the Form',
    description: 'Email the form to all members of the team. They will receive unique passwords to access the form. All responses will be located in the Responses tab.'
  },
  {
    number: 4,
    title: 'Synthesize a Report',
    description: 'Once at least 3 people on the team have responded, synthesize a report based on their answers with a single click!'
  }
];

const faqs = [
  {
    question: 'Do employees need to create accounts with 360Feedback to submit and receive feedback?',
    answer: 'No. Employees will receive unique access codes in their email to use. Only the administrator needs a 360Feedback account.'
  },
  {
    question: 'Is user feedback anonymous?',
    answer: 'Feedback is not anonymous to administrators, but it is to the AI engine used to facilitate report synthesis. If a user is uncomfortable answering a question, they can leave it blank.'
  },
  {
    question: 'What is the purpose of this application?',
    answer: 'Team development. See <a href="https://en.wikipedia.org/wiki/360-degree_feedback" class="faq-link">here</a> for insight.'
  }
];

const chartData = computed(() => {
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
        responseRate: Math.min(100, responseRate),
        teamName: team?.name || 'Unknown Team'
      };
    })
    .sort((a, b) => b.responses - a.responses)
    .slice(0, 3);
  
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

const animateNumbers = () => {
  const elements = document.querySelectorAll('.stat-value[data-target]');
  
  elements.forEach((el) => {
    const target = parseInt(el.getAttribute('data-target') || '0');
    const duration = 1500;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(easeOutCubic * target);
      
      el.textContent = current.toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  });
};

const setupScrollAnimations = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  document.querySelectorAll('.animate-element').forEach((el) => {
    observer.observe(el);
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
        counts[form._id] = 0;
      }
    }
  }
  
  formResponseCounts.value = counts;
};

onMounted(async () => {
  try {
    let attempts = 0;
    while (!formsStore.loaded.value && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    await loadFormResponseCounts();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    loading.value = false;
    nextTick(() => {
      initChart();
      setupScrollAnimations();
      
      // Delay number animation to ensure elements are visible
      setTimeout(() => {
        animateNumbers();
      }, 300);
    });
  }
});
</script>

<style scoped>
/* Animation setup */
.animate-element {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.animate-element.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.dashboard-title {
  font-family: 'Petit Formal Script', cursive;
  font-size: 2.5rem;
  font-weight: 700;
  background: var(--gradient-1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.dashboard-title:hover {
  transform: scale(1.02);
  filter: brightness(1.1);
}

.dashboard-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.dashboard-header {
  margin-bottom: 3rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  text-align: center;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  margin-bottom: 1rem;
  color: var(--primary);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 2rem;
  transition: all 0.3s ease;
}

.stat-icon svg {
  width: 4rem;
  height: 4rem;
}

.stat-card:hover .stat-icon {
  transform: translateY(-3px);
  filter: drop-shadow(0 4px 8px rgba(37, 99, 235, 0.3));
}

.stat-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
}

.chart-container {
  height: 300px;
  padding: 1rem 0;
}

.section {
  margin-bottom: 3rem;
}

.section h2 {
  font-family: 'Petit Formal Script', cursive;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--title-primary);
  margin-bottom: 1rem;
}

.guide-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.step-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.3s ease;
}

.step-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.step-number {
  background: var(--gradient-1);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.step-number::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.step-card:hover .step-number::before {
  left: 100%;
}

.step-card:hover .step-number {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

.step-content h3 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.step-content p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-weight: 400;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
}

.faq-item {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.faq-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.faq-question {
  font-family: 'Poppins', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 1rem;
}

.faq-answer {
  color: var(--text-secondary);
  line-height: 1.6;
  font-weight: 400;
}

.faq-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
  position: relative;
  transition: all 0.3s ease;
}

.faq-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary);
  transition: width 0.3s ease;
}

.faq-link:hover::after {
  width: 100%;
}

.faq-link:hover {
  color: var(--primary-hover);
}
</style>