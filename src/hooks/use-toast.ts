import * as React from "react"

import { ToastAction as ToastActionPrimitive, Toast, ToastProps as ShadcnToastProps } from "@/components/ui/toast" // Import Toast and its props

// Corrected ToastProps to refer to the main Toast component
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 5000 // Changed to 5 seconds for more interactive control

export type ToasterToast = ToastProps & { // Exporting ToasterToast
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  onDismiss?: () => void; // Added onDismiss prop
}

// Update ToastActionElement to include long press props
type ToastActionElement = React.ReactElement<
  React.ComponentPropsWithoutRef<typeof ToastActionPrimitive> & {
    onLongPress?: () => void;
    longPressDelay?: number;
  }
>

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type State = {
  toasts: ToasterToast[]
}

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // ! Side effect ! - This will be executed in the next render cycle, immediately after state is updated
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => addToRemoveQueue(toast.id))
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: ((state: State) => void)[] = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

type ToastFunction = {
  (props: Omit<ToasterToast, 'id' | 'open' | 'onOpenChange' | 'onDismiss'>): { // Exclude onDismiss from input props
    id: string
    dismiss: () => void
    update: (props: Partial<ToasterToast>) => void
  }
  dismiss: (toastId?: string) => void
}

// Define and export the toast function directly
export const toast = function (props: Omit<ToasterToast, 'id' | 'open' | 'onOpenChange' | 'onDismiss'>) {
  const id = genId()

  const update = (newProps: Partial<ToasterToast>) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...newProps, id },
    })
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
      onDismiss: dismiss, // Pass the dismiss function as onDismiss
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
} as ToastFunction; // Cast to ToastFunction type

toast.dismiss = (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId })


function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
  }
}

const REMOVE_QUEUE: Map<string, number> = new Map()

const addToRemoveQueue = (toastId: string) => {
  if (REMOVE_QUEUE.has(toastId)) return

  REMOVE_QUEUE.set(toastId, setTimeout(() => {
    REMOVE_QUEUE.delete(toastId)
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId })
  }, TOAST_REMOVE_DELAY) as unknown as number) // Explicitly cast to number
}

export { useToast }