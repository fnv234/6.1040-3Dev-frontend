import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const setupDashboardScrollAnimations = () => {
  // Animate stats cards on scroll
  const statCards = document.querySelectorAll('.stat-card')
  if (statCards.length > 0) {
    gsap.fromTo(statCards,
      { 
        opacity: 0, 
        y: 30,
        scale: 0.9
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".stats-grid",
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    )
  }

  // Animate step cards
  const stepCards = document.querySelectorAll('.step-card')
  if (stepCards.length > 0) {
    gsap.fromTo(stepCards,
      { 
        opacity: 0, 
        x: -20,
        rotationY: -5
      },
      {
        opacity: 1,
        x: 0,
        rotationY: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".guide-steps",
          start: "top 85%",
          end: "bottom 15%",
          toggleActions: "play none none reverse"
        }
      }
    )
  }

  // Animate FAQ items
  const faqItems = document.querySelectorAll('.faq-item')
  if (faqItems.length > 0) {
    gsap.fromTo(faqItems,
      { 
        opacity: 0, 
        y: 20
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".faq-list",
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    )
  }

  // Animate chart section
  const chartSection = document.querySelector('.section')
  if (chartSection) {
    gsap.fromTo(chartSection,
      { 
        opacity: 0, 
        scale: 0.95
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: chartSection,
          start: "top 75%",
          end: "bottom 25%",
          toggleActions: "play none none reverse"
        }
      }
    )
  }
}

export const addMicroInteractions = () => {
  // Hover effects for cards
  const cards = document.querySelectorAll('.stat-card, .step-card, .faq-item')
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        scale: 1.02,
        y: -3,
        duration: 0.3,
        ease: "power2.out"
      })
    })
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      })
    })
  })

  // Pulse effect for step numbers
  const stepNumbers = document.querySelectorAll('.step-number')
  stepNumbers.forEach(number => {
    gsap.to(number, {
      scale: 1.05,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    })
  })

  // Button hover effects
  const buttons = document.querySelectorAll('.btn')
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, {
        scale: 1.05,
        duration: 0.2,
        ease: "back.out(1.7)"
      })
    })
    
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out"
      })
    })
  })
}

export const animateNumbers = () => {
  // Count up animation for stat values
  const animateValue = (element: Element, start: number, end: number, duration: number) => {
    const obj = { value: start }
    gsap.to(obj, {
      value: end,
      duration: duration,
      ease: "power2.out",
      onUpdate: function() {
        element.textContent = Math.round(obj.value).toString()
      }
    })
  }

  const statValues = document.querySelectorAll('.stat-value')
  statValues.forEach(element => {
    const finalValue = parseInt(element.textContent || '0')
    if (!isNaN(finalValue)) {
      animateValue(element, 0, finalValue, 2)
    }
  })
}

export const cleanupScrollAnimations = () => {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill())
}
