<template>
  <div class="stat-card-3d-container">
    <TresCanvas
      ref="canvasRef"
      :camera-position="[0, 0, 8]"
      :alpha="true"
      :width="300"
      :height="200"
      @created="onCanvasCreated"
    >
      <TresPerspectiveCamera :position="[0, 0, 8]" />
      <TresAmbientLight :intensity="0.8" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="0.6" />
      
      <!-- 3D Cube for each stat -->
      <TresMesh
        ref="meshRef"
        :position="[0, 0, 0]"
        :rotation="[rotation[0] as number, rotation[1] as number, rotation[2] as number]"
        @pointer-over="onHover"
        @pointer-out="onLeave"
      >
        <TresBoxGeometry :args="[3, 2, 1]" />
        <TresMeshStandardMaterial 
          :color="props.color" 
          :metalness="0.2"
          :roughness="0.3"
        />
      </TresMesh>
    </TresCanvas>
    
    <!-- Overlay content -->
    <div class="stat-overlay" :style="{ transform: `rotateY(${rotation[1]}rad)` }">
      <div class="stat-icon" v-html="icon"></div>
      <h3>{{ label }}</h3>
      <p class="stat-value" :data-target="value">0</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  label: string
  value: number
  icon: string
  color?: string
  position?: [number, number, number]
}

const props = withDefaults(defineProps<Props>(), {
  color: '#2563eb',
  position: () => [0, 0, 0]
})

const meshRef = ref()
const rotation = ref([0, 0, 0])
const isHovered = ref(false)

const onCanvasCreated = () => {
  // Scene setup
}

const onHover = () => {
  isHovered.value = true
  rotation.value = [0.2, 0.2, 0]
}

const onLeave = () => {
  isHovered.value = false
  rotation.value = [0, 0, 0]
}

// Simple animation loop without useRenderLoop
let animationId: number
const animate = () => {
  if (meshRef.value && meshRef.value.rotation && !isHovered.value) {
    meshRef.value.rotation.y += 0.005
  }
  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  animate()
  
  // Number counting animation
  const element = document.querySelector('.stat-value[data-target]') as HTMLElement
  if (element) {
    const target = parseInt(element.getAttribute('data-target') || '0')
    const duration = 1500
    const startTime = performance.now()
    
    const animateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(easeOutCubic * target)
      
      element.textContent = current.toString()
      
      if (progress < 1) {
        requestAnimationFrame(animateNumber)
      }
    }
    
    requestAnimationFrame(animateNumber)
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped>
.stat-card-3d-container {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 16px;
  overflow: hidden;
}

.stat-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
  z-index: 10;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.stat-icon {
  margin-bottom: 0.5rem;
  color: white;
  display: flex;
  justify-content: center;
}

.stat-overlay h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}
</style>
