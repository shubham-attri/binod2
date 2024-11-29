"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import {
  Toast,
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

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

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export function useToast() {
  const [state, setState] = React.useState<State>({ toasts: [] })

  React.useEffect(() => {
    state.toasts.forEach((toast) => {
      if (toast.id && !toast.duration) addToRemoveQueue(toast.id)
    })
  }, [state.toasts])

  const toast = React.useCallback(function ({
    ...props
  }: Omit<ToasterToast, "id">) {
    const id = genId()

    setState((state) => ({
      ...state,
      toasts: [
        ...state.toasts,
        { ...props, id },
      ],
    }))

    return id
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    setState((state) => ({
      ...state,
      toasts: state.toasts.map((toast) =>
        toast.id === toastId || toastId === undefined
          ? {
              ...toast,
              open: false,
            }
          : toast
      ),
    }))
  }, [])

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  }
}
