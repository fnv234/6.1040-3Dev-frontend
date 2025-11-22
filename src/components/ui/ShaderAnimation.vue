<template>
  <div ref="containerRef" class="w-full h-screen" style="background: #000; overflow: hidden;"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

const containerRef = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene | null = null
let camera: THREE.Camera | null = null
let renderer: THREE.WebGLRenderer | null = null
let uniforms: any = null
let animationId: number | null = null

onMounted(() => {
  if (!containerRef.value) return

  const container = containerRef.value

  const vertexShader = `
    void main() {
      gl_Position = vec4( position, 1.0 );
    }
  `

  const fragmentShader = `
    #define TWO_PI 6.2831853072
    #define PI 3.14159265359

    precision highp float;
    uniform vec2 resolution;
    uniform float time;

    void main(void) {
      vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
      float t = time*0.05;
      float lineWidth = 0.002;

      vec3 color = vec3(0.0);
      for(int j = 0; j < 3; j++){
        for(int i=0; i < 5; i++){
          color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
        }
      }
      
      gl_FragColor = vec4(color[0],color[1],color[2],1.0);
    }
  `

  camera = new THREE.Camera()
  camera.position.z = 1

  scene = new THREE.Scene()
  const geometry = new THREE.PlaneGeometry(2, 2)

  uniforms = {
    time: { type: 'f', value: 1.0 },
    resolution: { type: 'v2', value: new THREE.Vector2() },
  }

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  })

  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)

  container.appendChild(renderer.domElement)

  const onWindowResize = () => {
    if (!renderer) return
    const width = container.clientWidth
    const height = container.clientHeight
    renderer.setSize(width, height)
    uniforms.resolution.value.x = renderer.domElement.width
    uniforms.resolution.value.y = renderer.domElement.height
  }

  onWindowResize()
  window.addEventListener('resize', onWindowResize, false)

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    uniforms.time.value += 0.05
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }

  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
})
</script>
