import { type Ref } from 'vue'

export interface SidebarContext {
  open: Ref<boolean>
  setOpen: (value: boolean) => void
  animate: Ref<boolean>
}
