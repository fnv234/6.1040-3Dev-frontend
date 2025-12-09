import { gsap } from 'gsap'

export const fadeIn = (element: HTMLElement | HTMLElement[], options?: gsap.TweenVars) => {
  return gsap.fromTo(element, 
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", ...options }
  )
}

export const slideInLeft = (element: HTMLElement | HTMLElement[], options?: gsap.TweenVars) => {
  return gsap.fromTo(element,
    { opacity: 0, x: -50 },
    { opacity: 1, x: 0, duration: 0.5, ease: "power3.out", ...options }
  )
}

export const slideInRight = (element: HTMLElement | HTMLElement[], options?: gsap.TweenVars) => {
  return gsap.fromTo(element,
    { opacity: 0, x: 50 },
    { opacity: 1, x: 0, duration: 0.5, ease: "power3.out", ...options }
  )
}

export const scaleIn = (element: HTMLElement | HTMLElement[], options?: gsap.TweenVars) => {
  return gsap.fromTo(element,
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)", ...options }
  )
}

export const staggerCards = (elements: HTMLElement[], options?: gsap.TweenVars) => {
  return gsap.fromTo(elements,
    { opacity: 0, y: 30, scale: 0.95 },
    { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      duration: 0.5, 
      stagger: 0.1, 
      ease: "power2.out",
      ...options 
    }
  )
}

export const hoverScale = (element: HTMLElement) => {
  const hover = gsap.to(element, {
    scale: 1.05,
    duration: 0.3,
    ease: "power2.out",
    paused: true
  })
  
  element.addEventListener('mouseenter', () => hover.play())
  element.addEventListener('mouseleave', () => hover.reverse())
  
  return hover
}

export const pageTransition = {
  enter: (element: HTMLElement) => {
    return gsap.fromTo(element,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    )
  },
  
  leave: (element: HTMLElement) => {
    return gsap.to(element,
      { opacity: 0, y: -20, duration: 0.3, ease: "power2.in" }
    )
  }
}
