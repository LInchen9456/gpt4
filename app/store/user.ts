import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import { getHeaders } from "../client/api";

const DEFAULT_ACCESS_STATE = {
  userinfo: {},
  token: "",
  modalOpen: false,
};

export const useUserStore = createPersistStore(
  { ...DEFAULT_ACCESS_STATE },

  (set, get) => ({
    login(username: string, smsCode: string) {
      return fetch("/v1/charGtplogin", {
        method: "post",
        body: JSON.stringify({
          smsCode,
          username,
        }),
        headers: {
          ...getHeaders(),
        },
      }).then((res) => res.json());
    },

    setModalOpen(isOpen: boolean) {
      set({
        modalOpen: isOpen,
      });
    },

    sendCode(username: string | Blob) {
      const formData = new FormData();
      formData.append("phone", username);
      return fetch("/v1/send/phoneCode", {
        method: "POST",
        body: formData,
      }).then((res) => res.json());
    },

    isLogin() {
      return !!get().token;
    },
  }),
  {
    name: StoreKey.User,
  },
);
