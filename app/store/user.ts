import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import { getHeaders } from "../client/api";

const DEFAULT_ACCESS_STATE = {
  userinfo: {},
  token: "",
  modalOpen: false,
  validPackageList: []
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

      if(isOpen){
        fetch("/v1/member/package/validPackageList", {
          headers: {
            Authorization: "Bearer " + get().token,
          },
        })
          .then((res) => res.json())
          .then((res) => {
            const { code } = res;
            let validPackageList = []

            if (code === 200) {
                validPackageList = res.data
            } else {
              // messageApi.open({
              //   type: "error",
              //   content: res.msg,
              // });
            }
            set({
              validPackageList: validPackageList
            })
          });
      }
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
    logout() {
      set({
        token: "",
      });
    },
  }),
  {
    name: StoreKey.User,
  },
);
