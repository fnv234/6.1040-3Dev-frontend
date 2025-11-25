<template>
  <UForm
    :schema="formSchema"
    :state="formState"
    :validate-on="['blur', 'change']"
    @submit="handleSubmit"
    @error="onError"
  >
    <div v-for="(question, index) in questions" :key="index" class="space-y-2">
      <UFormGroup
        :label="`${index + 1}. ${question.prompt}`"
        :name="`question-${index}`"
        :required="question.required"
      >
        <!-- Text Input -->
        <UInput
          v-if="question.type === 'Free' && question.prompt.length <= 50"
          v-model="formState[`question-${index}`]"
          :placeholder="question.placeholder || 'Your answer'"
        />

        <!-- Textarea for longer responses -->
        <UTextarea
          v-else-if="question.type === 'Free'"
          v-model="formState[`question-${index}`]"
          :rows="4"
          :placeholder="question.placeholder || 'Your answer'"
        />

        <!-- Multiple Choice -->
        <USelect
          v-else-if="question.type === 'Multiple Choice'"
          v-model="formState[`question-${index}`]"
          :options="question.options || []"
          :placeholder="question.placeholder || 'Select an option'"
        />

        <!-- Scale/Slider -->
        <div v-else-if="question.type === 'Scale'" class="space-y-2">
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500">{{ question.min || 1 }}</span>
            <URange
              v-model="formState[`question-${index}`]"
              :min="question.min || 1"
              :max="question.max || 5"
              :step="question.step || 1"
              class="flex-1"
            />
            <span class="text-sm text-gray-500">{{ question.max || 5 }}</span>
          </div>
          <div class="text-center">
            <span class="text-sm font-medium">
              Selected: {{ formState[`question-${index}`] || question.min || 1 }}
            </span>
          </div>
        </div>
      </UFormGroup>
    </div>

    <div class="flex justify-end space-x-3 pt-4">
      <UButton
        type="button"
        variant="soft"
        color="gray"
        @click="$emit('cancel')"
      >
        Cancel
      </UButton>
      <UButton
        type="submit"
        :loading="isSubmitting"
        :disabled="isSubmitting"
      >
        Submit Feedback
      </UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { z } from 'zod'

// Define the event types locally since they're not exported from @nuxt/ui
interface FormSubmitEvent<T = any> {
  data: T
  preventDefault: () => void
}

interface FormErrorEvent {
  errors: Array<{
    name?: string
    message: string
  }>
  preventDefault: () => void
}

const props = defineProps({
  questions: {
    type: Array as () => Array<{
      type: 'Multiple Choice' | 'Free' | 'Scale';
      prompt: string;
      required?: boolean;
      options?: string[];
      min?: number;
      max?: number;
      step?: number;
      placeholder?: string;
    }>,
    required: true
  }
})

const emit = defineEmits(['submit', 'cancel'])

// Initialize form state based on questions
const formState = reactive<Record<string, any>>({})
const isSubmitting = ref(false)

// Initialize form state with default values
props.questions.forEach((question, index) => {
  if (question.type === 'Scale') {
    formState[`question-${index}`] = question.min || 1
  } else {
    formState[`question-${index}`] = null
  }
})

// Create dynamic validation schema
const formSchema = computed(() => {
  const schema: Record<string, z.ZodTypeAny> = {}
  
  props.questions.forEach((question, index) => {
    let validator: z.ZodTypeAny
    
    switch (question.type) {
      case 'Free':
        validator = z.string()
        if (question.required) {
          validator = (validator as z.ZodString).min(1, 'This field is required')
        }
        break
        
      case 'Multiple Choice':
        validator = z.string()
        if (question.required) {
          validator = (validator as z.ZodString).min(1, 'Please select an option')
        }
        break
        
      case 'Scale':
        validator = question.required
          ? (z.number().min(question.min || 1).max(question.max || 5) as z.ZodNumber)
          : z.number().optional()
        break
        
      default:
        validator = z.any()
    }
    
    schema[`question-${index}`] = validator
  })
  
  return z.object(schema)
})

async function handleSubmit(event: FormSubmitEvent) {
  try {
    isSubmitting.value = true
    
    // Format the responses
    const responses = props.questions.map((question, index) => ({
      questionId: index,
      questionText: question.prompt,
      response: (event.data as any)[`question-${index}`],
      type: question.type
    }))
    
    // Emit the form data
    emit('submit', responses)
  } catch (error) {
    console.error('Error submitting form:', error)
  } finally {
    isSubmitting.value = false
  }
}

function onError(event: FormErrorEvent) {
  console.error('Form validation errors:', event.errors)
  // You can handle form errors here, e.g., show a toast message
}
</script>

<style scoped>
.rating-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>