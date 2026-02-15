import { create } from "zustand";
import type { ListInvite } from "../types";

export type ConfirmModalType =
  | "DELETE_LIST"
  | "LEAVE_LIST"
  | "CLEAR_COMPLETED"
  | null;

export type ConfirmModalPayload =
  | { listId: string }
  | Record<string, never>;

export type ConfirmModalState =
  | { isOpen: false; type: null; payload: null }
  | { isOpen: true; type: "DELETE_LIST"; payload: { listId: string } }
  | { isOpen: true; type: "LEAVE_LIST"; payload: { listId: string } }
  | { isOpen: true; type: "CLEAR_COMPLETED"; payload: Record<string, never> };

export type ToastType = "success" | "error";

export interface UIState {
  toast: { msg: string; type: ToastType } | null;
  confirmModal: ConfirmModalState;
  shareListId: string | null;
  inviteModal: {
    isOpen: boolean;
    invite: ListInvite | null;
  };
  actions: {
    showToast: (msg: string, type?: ToastType) => void;
    clearToast: () => void;
    openConfirm: (
      type: NonNullable<ConfirmModalType>,
      payload: ConfirmModalPayload
    ) => void;
    closeConfirm: () => void;
    setShareListId: (id: string | null) => void;
    openInviteModal: (invite: ListInvite) => void;
    closeInviteModal: () => void;
  };
}

const initialConfirmModal: ConfirmModalState = {
  isOpen: false,
  type: null,
  payload: null,
};

export const useUIStore = create<UIState>((set) => ({
  toast: null,
  confirmModal: initialConfirmModal,
  shareListId: null,
  inviteModal: { isOpen: false, invite: null },
  actions: {
    showToast: (msg, type = "error") =>
      set({ toast: { msg, type } }),
    clearToast: () => set({ toast: null }),
    openConfirm: (type, payload) =>
      set({
        confirmModal: {
          isOpen: true,
          type,
          payload: type === "CLEAR_COMPLETED" ? {} : payload,
        } as ConfirmModalState,
      }),
    closeConfirm: () => set({ confirmModal: initialConfirmModal }),
    setShareListId: (id) => set({ shareListId: id }),
    openInviteModal: (invite) =>
      set({
        inviteModal: { isOpen: true, invite },
      }),
    closeInviteModal: () =>
      set({
        inviteModal: { isOpen: false, invite: null },
      }),
  },
}));
