import { useEffect, useRef, useMemo, useState } from "react";
import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import UserinfoIcon from "../icons/userinfo.svg";
import GithubIcon from "../icons/github.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
import DragIcon from "../icons/drag.svg";
import QRCode  from 'qrcode.react';

import Locale from "../locales";

import { useAppConfig, useChatStore, useUserStore } from "../store";
import { message } from "antd";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
} from "../constant";

import { Link, useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { showConfirm, showToast } from "./ui-lib";
import { Modal, Table, Typography, Space, Button, Flex } from "antd";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});
let timer: any

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

export function SideBar(props: { className?: string }) {
  const [messageApi, contextHolder] = message.useMessage();
  const userStore = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
  const [qrcode, setQrcode] = useState("");
  const [ordersn, setOrdersn] = useState("");
  const [loading, setLoading] = useState(false);
  const [userinfo, setUserinfo] = useState({
    nickname: "",
    expirationTime3: "",
    expirationTime4: "",
  });

  const columns = [
    {
      title: "套餐名称",
      dataIndex: "packageName",
      key: "packageName",
    },
    {
      title: "套餐天数",
      dataIndex: "numberDays",
      key: "numberDays",
    },
    {
      title: "套餐价格",
      dataIndex: "packagePrice",
      key: "packagePrice",
    },
    {
      title: "套餐价格",
      dataIndex: "packagePrice",
      key: "packagePrice",
    },
    {
      title: "套餐类型",
      dataIndex: "packageType",
      key: "packageType",
    },
    {
      title: "操作",
      width: 80,
      fixed: "right",
      render: (row: { id: string }) => (
        <Space>
          <Typography.Link
            onClick={() => {
              purchase(row);
            }}
          >
            购买
          </Typography.Link>
        </Space>
      ),
    },
  ] as any;

  const purchase = (row: { id: string }) => {
    fetch("/v1/wxpay/qrcode/" + row.id, {
      headers: {
        Authorization: "Bearer " + userStore.token,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        const { code, data } = res;
        if (code === 200) {
          setQrcode(data.qrcode);
          setOrdersn(data.ordersn);

          let counter = 1;
          timer = setInterval(async function() {
            // console.log("第 " + counter + " 秒");

            counter++;
            let result = await query(data.ordersn)
            let json = await result.json();
            if(json.code == 200){
              clearInterval(timer); 
              messageApi.open({
                type: "success",
                content: json.data,
              });
              setIsModalOpen(false);
            }
            if (counter > 30) {
              clearInterval(timer); 
            }
          }, 1000);

          
          setIsModalOpen(true);
        } else {
          messageApi.open({
            type: "error",
            content: res.msg,
          });
        }
      });
  };

  const handleOk = () => {
    userStore.setModalOpen(false);
  };

  const handleCancel = () => {
    userStore.setModalOpen(false);
  };

  const handleQrcodeOk = () => {
    setIsModalOpen(false);
  };

  const handleQrcodeCancel = () => {
    setIsModalOpen(false);
  };

  const handlePersonalOk = () => {
    setIsPersonalModalOpen(false)
  };

  const handlePersonalCancel = () => {
    setIsPersonalModalOpen(false)
  };

  const personalModalOpen = () => {
    fetch("/v1/chat/info", {
      headers: {
        Authorization: "Bearer " + userStore.token,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        const { code, data } = res;
        if (code == 200) {
          setUserinfo(data)
          setIsPersonalModalOpen(true)
        }
      })
  }

  const handlePayOk = async () => {
    setLoading(true);
    let result = await query()
    let json = await result.json();
    
    setLoading(false);

    const { code, data } = json;
    if (code === 200) {
      messageApi.open({
        type: "success",
        content: data,
      });
      setIsModalOpen(false);
    } else {
      messageApi.open({
        type: "error",
        content: data,
      });
    }

  };
  function query(o = null){
    let sn = o? o: ordersn
    console.log(sn)
    return fetch("/v1/wxpay/query/" + sn, {
      headers: {
        Authorization: "Bearer " + userStore.token,
      },
    }) ;
  }

  const handlePayCancel = () => {
    setIsModalOpen(false);
    setLoading(false);
    clearInterval(timer); 
  };

  const logout= async () => {
    if (await showConfirm(Locale.Home.LogoutConfirm)) {
      userStore.logout()
    }
  };

  const chatStore = useChatStore();

  // drag side bar
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );

  useHotKey();

  return (
    <>
      {contextHolder}
      <div
        className={`${styles.sidebar} ${props.className} ${
          shouldNarrow && styles["narrow-sidebar"]
        }`}
        style={{
          // #3016 disable transition on ios mobile screen
          transition: isMobileScreen && isIOSMobile ? "none" : undefined,
        }}
      >
        <div className={styles["sidebar-header"]} data-tauri-drag-region>
          <div className={styles["sidebar-title"]} data-tauri-drag-region>
            ChatGPT Next
          </div>
          <div className={styles["sidebar-sub-title"]}>
            Build your own AI assistant.
          </div>
          <div className={styles["sidebar-logo"] + " no-dark"}>
            <ChatGptIcon />
          </div>
        </div>

        <div className={styles["sidebar-header-bar"]}>
          <IconButton
            icon={<MaskIcon />}
            text={shouldNarrow ? undefined : Locale.Mask.Name}
            className={styles["sidebar-bar-button"]}
            onClick={() => {
              if (config.dontShowMaskSplashScreen !== true) {
                navigate(Path.NewChat, { state: { fromHome: true } });
              } else {
                navigate(Path.Masks, { state: { fromHome: true } });
              }
            }}
            shadow
          />
          <IconButton
            icon={<PluginIcon />}
            text={shouldNarrow ? undefined : Locale.Plugin.Name}
            className={styles["sidebar-bar-button"]}
            onClick={() => showToast(Locale.WIP)}
            shadow
          />
        </div>

        <div
          className={styles["sidebar-body"]}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              navigate(Path.Home);
            }
          }}
        >
          <ChatList narrow={shouldNarrow} />
        </div>

        <div className={styles["sidebar-tail"]}>
          <div className={styles["sidebar-actions"]}>
            <div className={styles["sidebar-action"] + " " + styles.mobile}>
              <IconButton
                icon={<DeleteIcon />}
                onClick={async () => {
                  if (await showConfirm(Locale.Home.DeleteChat)) {
                    chatStore.deleteSession(chatStore.currentSessionIndex);
                  }
                }}
              />
            </div>
            <div className={styles["sidebar-action"]}>
              <Link to={Path.Settings}>
                <IconButton icon={<SettingsIcon />} shadow />
              </Link>
            </div>
          </div>
          {userStore.token && (
            <div>
              <IconButton
                icon={<UserinfoIcon />}
                text={shouldNarrow ? undefined : Locale.Home.Personal}
                onClick={() => {
                  personalModalOpen()
                }}
                shadow
              />
            </div>
          )}
          <div>
            <IconButton
              icon={<AddIcon />}
              text={shouldNarrow ? undefined : Locale.Home.NewChat}
              onClick={() => {
                if (config.dontShowMaskSplashScreen) {
                  chatStore.newSession();
                  navigate(Path.Chat);
                } else {
                  navigate(Path.NewChat);
                }
              }}
              shadow
            />
          </div>
        </div>

        <div
          className={styles["sidebar-drag"]}
          onPointerDown={(e) => onDragStart(e as any)}
        >
          <DragIcon />
        </div>
      </div>
      <Modal
        title="购买套餐"
        open={userStore.modalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Table dataSource={userStore.validPackageList} columns={columns} pagination={false} />
      </Modal>
      <Modal
        title="扫码支付"
        open={isModalOpen}
        onOk={handleQrcodeOk}
        onCancel={handleQrcodeCancel}
        footer={[
          <Button key="back" onClick={handlePayCancel}>
            取消支付
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handlePayOk}>
            支付成功
          </Button>,
        ]}
      >
        <QRCode
            value={qrcode}  //生成二维码的内容
            size={256} //二维码尺寸
            fgColor="#000000"  //二维码颜色
        />
      </Modal>
      <Modal
        title={Locale.Home.Personal}
        open={isPersonalModalOpen}
        onOk={handlePersonalOk}
        onCancel={handlePersonalCancel}
        footer={null}
        width={600}
      >
        <div style={{ margin: '20px 0' }}>
          {userinfo.expirationTime3 && (
            <div>GPT3过期时间：{userinfo.expirationTime3}</div>
          )}
          {userinfo.expirationTime4 && (
            <div>GPT4过期时间：{userinfo.expirationTime4}</div>
          )}
        </div>
        <div>
          <Flex gap="small" align="center" wrap="wrap">
            <Button type="primary" onClick={() => {
              userStore.setModalOpen(true)
            }}>{Locale.Home.Recharge}</Button>
            <Button danger onClick={() => {
              logout()
            }}>{Locale.Home.Logout}</Button>
          </Flex>
        </div>
      </Modal>
    </>
  );
}
