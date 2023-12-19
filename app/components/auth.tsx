import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore, useUserStore } from "../store";
import Locale from "../locales";
import { Button, message, Form, Input, Space, ConfigProvider } from "antd";
import { getHeaders } from "../client/api";
import logo from "../../src-tauri/icons/icon.png";

import BotIcon from "../icons/bot.svg";
import { useEffect, useState } from "react";
import { getClientConfig } from "../config/client";

export function AuthPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  const goHome = () => navigate(Path.Home);
  const goChat = () => {
    userStore.login(username, smsCode).then((res) => {
      if (res.code === 200) {
        userStore.update((user) => (user.token = res.token));
        messageApi.open({
          type: "success",
          content: "登录成功",
        });
        navigate(Path.Chat);
      } else {
        messageApi.open({
          type: "error",
          content: res.msg,
        });
      }
    });
  };
  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
    });
  }; // Reset access code to empty string

  useEffect(() => {
    if (getClientConfig()?.isApp) {
      navigate(Path.Settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onFinish = (values: any) => {
    goChat();
    // fetch("http://vk6.nat300.top/charGtplogin", {
    //   method: "post",
    //   body: JSON.stringify({
    //     ...values
    //   }),
    //   headers: {
    //     ...getHeaders(),
    //   },
    // })
    //   .then((res) => res.json())
    //   .then((res: DangerConfig) => {
    //     if (res.code === 200) {
    //       localStorage.setItem('token', res.token)
    //       messageApi.open({
    //         type: 'success',
    //         content: '登录成功',
    //       });
    //     } else {
    //       messageApi.open({
    //         type: 'error',
    //         content: res.msg,
    //       });
    //     }
    //   })
    //   .catch(() => {

    //   })
    //   .finally(() => {

    //   });
    console.log("Success:", values);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  type FieldType = {
    username?: string;
    smsCode?: string;
    remember?: string;
  };
  const [username, setUsername] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [second, setSecond] = useState(0);
  const onTabChange = (key: string) => {
    console.log(key);
  };
  const sendPhoneCode = () => {
    if (!username) {
      return messageApi.open({
        type: "error",
        content: "请输入账号",
      });
    }
    userStore.sendCode(username).then((res) => {
      if (res.code === 200) {
        setSecond(60);
        messageApi.open({
          type: "success",
          content: "发送验证码成功",
        });
        let remainingSeconds = 60;

        const timer = setInterval(() => {
          remainingSeconds -= 1;
          setSecond(remainingSeconds);

          if (remainingSeconds === 0) {
            clearInterval(timer); // 倒计时结束，清除定时器
          }
        }, 1000);
      } else {
        messageApi.open({
          type: "error",
          content: res.msg,
        });
      }
    });
  };
  return (
    <>
      {contextHolder}
      <div className={styles.formBox}>
        <div className={styles.box}>
          <img src={logo.src} />
          <Form
            name="basic"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            style={{ maxWidth: 600 }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            labelAlign="left"
          >
            <Form.Item<FieldType>
              label={Locale.Auth.Account}
              name="username"
              rules={[
                { required: true, message: Locale.Auth.AccountPlaceholder },
              ]}
            >
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  placeholder={Locale.Auth.AccountPlaceholder}
                  onChange={(e) => {
                    userStore.update((user) =>
                      setUsername(e.currentTarget.value),
                    );
                  }}
                />
              </Space.Compact>
            </Form.Item>
            <Form.Item<FieldType>
              label={Locale.Auth.Code}
              name="smsCode"
              rules={[{ required: true, message: Locale.Auth.CodePlaceholder }]}
            >
              <div>
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder={Locale.Auth.CodePlaceholder}
                    onChange={(e) => {
                      userStore.update((user) =>
                        setSmsCode(e.currentTarget.value),
                      );
                    }}
                  />
                  <ConfigProvider
                    theme={{
                      components: {
                        Button: {
                          defaultBg: "#ffc74a",
                          defaultColor: "#ffffff",
                        },
                      },
                    }}
                  >
                    <Button onClick={sendPhoneCode} disabled={second > 0}>
                      {second ? second + "秒" : "发送" + Locale.Auth.Code}
                    </Button>
                  </ConfigProvider>
                </Space.Compact>
              </div>
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button type="primary" htmlType="submit" size="large" block>
                登录
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </>
    /* <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <BotIcon />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Account}</div>

      <input
        className={styles["auth-input"]}
        type="smsCode"
        placeholder={Locale.Auth.Input}
        value={userStore.username}
        onChange={(e) => {
          userStore.update(
            (user) => (user.username = e.currentTarget.value),
          );
        }}
      />
      <div className={styles["auth-tips"]}>{Locale.Auth.Code}</div>
      <input
        className={styles["auth-input"]}
        type="smsCode"
        placeholder={Locale.Auth.CodePlaceholder}
        value={userStore.code}
        onChange={(e) => {
          userStore.update(
            (user) => (user.code = e.currentTarget.value),
          );
        }}
      />

      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.Auth.Confirm}
          type="primary"
          onClick={goChat}
        />
        {<IconButton
          text={Locale.Auth.Later}
          onClick={() => {
            resetAccessCode();
            goHome();
          }}
        />}
      </div>
    </div> */
  );
}
