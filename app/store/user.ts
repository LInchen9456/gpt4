import {
  StoreKey,
} from "../constant";
import { createPersistStore } from "../utils/store";
import { login } from '../api/user'
import { getHeaders } from "../client/api";

const DEFAULT_ACCESS_STATE = {
  userinfo: {},
  token: ""
};

export const useUserStore = createPersistStore(
  { ...DEFAULT_ACCESS_STATE },

  (set, get) => ({
    login(username, smsCode) {
      return fetch("http://vk6.nat300.top/charGtplogin", {
        method: "post",
        body: JSON.stringify({
          smsCode,
          username,
        }),
        headers: {
          ...getHeaders(),
        },
      })
        .then((res) => res.json())


    },

    sendCode(username) {
      const formData = new FormData();
      formData.append("phone", username);
      return fetch("http://vk6.nat300.top/send/phoneCode", {
        method: "POST",
        body: formData
      })
        .then((res) => res.json())

    },

    isLogin() {
      return !!get().token;
    },
  }),
  {
    name: StoreKey.User,
  },
);
