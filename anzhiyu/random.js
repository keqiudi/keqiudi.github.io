var posts=["2025/08/30/AWS介绍/","2024/02/08/C++-关键字用法/","2025/08/29/CMSIS标准/","2024/02/21/C++-学习笔记/","2025/08/30/CRC校验/","2025/08/29/FreeRTOS移植/","2025/06/03/CMake学习笔记/","2025/08/29/DMA专栏/","2025/08/29/FreeRTOS调试/","2025/08/29/FreeRTOS使用/","2025/08/29/GUIGuider的使用/","2025/08/29/Jlink-RTT的使用/","2025/08/29/Jlink-SystemView的使用/","2025/08/29/LVGL内存优化/","2025/08/29/LCD显示屏开发/","2025/08/29/LCD触摸屏开发/","2025/08/29/LVGL基础/","2023/03/06/Linux常用指令/","2025/08/29/MCU上电启动流程/","2025/08/29/LVGL移植到STM32/","2025/08/29/LVGL调试/","2025/08/30/MCU加密防拷贝方案/","2025/08/30/MQTT连接AWS-IoT/","2025/08/29/LVGL调度/","2023/09/16/MySQL数据库/","2023/09/16/MySQL通用语法及操作/","2023/12/27/Qt/","2025/05/23/PCB-Layout/","2025/08/29/STM32上电启动流程/","2025/08/30/PCB设计-基于立创EDA/","2025/08/29/SquareLine的使用/","2025/08/30/TLS传输层安全协议/","2025/05/23/USB接口/","2023/07/29/github使用/","2023/12/27/keil的基本使用/","2023/04/02/STM32HAL库/","2023/11/01/七大查找算法/","2025/08/29/vscode搭建LVGL模拟器/","2025/08/29/使用DMA驱动SPI显示屏/","2025/08/29/使用FreeRTOS遇到的一些问题/","2023/03/03/socket/","2025/08/30/加密算法/","2023/12/27/在CLion上愉快的写Qt/","2025/08/29/嵌入式内存分区详解/","2025/08/29/嵌入式开发中的一些关键字/","2023/07/14/多线程/","2023/11/06/排序算法/","2025/08/29/嵌入式软件架构层次/","2023/07/21/服务器并发/","2025/01/13/STM32标准库/","2025/08/29/栈回溯与CmBacktrace库的使用/","2025/05/23/电容的使用/","2025/05/23/电源管理芯片/","2025/11/08/栈/","2023/11/05/算法概述/","2025/05/23/电源转换芯片/","2023/07/16/线程池/","2023/07/14/虚拟地址空间/","2023/07/15/线程同步/","2023/07/18/线程池C-版/","2025/08/29/软件I2C的引脚配置问题/","2023/12/27/配置CLion环境用于STM32开发/","2025/08/29/配置ESP-IDF环境/","2025/08/29/驱动架构/","2025/11/08/链表/","2025/11/08/队列/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };var friend_link_list=[{"name":"Hexo","link":"https://hexo.io/zh-tw/","avatar":"https://d33wubrfki0l68.cloudfront.net/6657ba50e702d84afb32fe846bed54fba1a77add/827ae/logo.svg","descr":"快速、简单且强大的网站框架","siteshot":"/assets/hexo.jpg"},{"name":"butterfly","link":"https://butterfly.js.org/","avatar":"/assets/butterfly.png","descr":"一款基于 Vue3 的博客主题","siteshot":"/assets/butterfly1.png"},{"name":"anzhiyu主题","link":"https://blog.anheyu.com/","avatar":"https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg","descr":"生活明朗，万物可爱","siteshot":"https://npm.elemecdn.com/anzhiyu-theme-static@1.1.6/img/blog.anheyu.com.jpg"},{"name":"Fomalhaut🥝","link":"https://www.fomal.cc/","avatar":"https://www.fomal.cc/assets/avatar.webp","descr":"Future is now 🍭🍭🍭","siteshot":"https://source.fomal.cc/siteshot/www.fomal.cn.jpg"},{"name":"安知鱼","link":"https://blog.anheyu.com/","avatar":"https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg","descr":"生活明朗，万物可爱","siteshot":"https://npm.elemecdn.com/anzhiyu-theme-static@1.1.6/img/blog.anheyu.com.jpg","color":"vip","tag":"技术"},{"name":"Fomalhaut🥝","link":"https://www.fomal.cc/","avatar":"https://www.fomal.cc/assets/avatar.webp","descr":"Future is now 🍭🍭🍭","siteshot":"https://source.fomal.cc/siteshot/www.fomal.cn.jpg","color":"vip","tag":"技术"},{"name":"爱编程的大丙","link":"https://subingwen.cn","avatar":"https://subingwen.cn/images/comment.gif","siteshot":"https://subingwen.cn/images/siteshot.png","descr":"程序猿里边做饭比较好吃的一个讲师","color":"vip","tag":"技术"},{"name":"油炸鸡开源硬件","link":"https://no-chicken.com/","avatar":"https://no-chicken.com/icons/main.svg","siteshot":"https://i.postimg.cc/SxgdNhqH/image.png","descr":"开源软硬件","color":"vip","tag":"技术"},{"name":"何胜鹏","link":"https://www.thehsp.cn/","avatar":"https://i.postimg.cc/hG3dPJgH/fda91706f29ff4047883c4b7b84449e.jpg","descr":"未来的网安大佬","recommend":true}];
    var refreshNum = 1;
    function friendChainRandomTransmission() {
      const randomIndex = Math.floor(Math.random() * friend_link_list.length);
      const { name, link } = friend_link_list.splice(randomIndex, 1)[0];
      Snackbar.show({
        text:
          "点击前往按钮进入随机一个友链，不保证跳转网站的安全性和可用性。本次随机到的是本站友链：「" + name + "」",
        duration: 8000,
        pos: "top-center",
        actionText: "前往",
        onActionClick: function (element) {
          element.style.opacity = 0;
          window.open(link, "_blank");
        },
      });
    }
    function addFriendLinksInFooter() {
      var footerRandomFriendsBtn = document.getElementById("footer-random-friends-btn");
      if(!footerRandomFriendsBtn) return;
      footerRandomFriendsBtn.style.opacity = "0.2";
      footerRandomFriendsBtn.style.transitionDuration = "0.3s";
      footerRandomFriendsBtn.style.transform = "rotate(" + 360 * refreshNum++ + "deg)";
      const finalLinkList = [];
  
      let count = 0;

      while (friend_link_list.length && count < 3) {
        const randomIndex = Math.floor(Math.random() * friend_link_list.length);
        const { name, link, avatar } = friend_link_list.splice(randomIndex, 1)[0];
  
        finalLinkList.push({
          name,
          link,
          avatar,
        });
        count++;
      }
  
      let html = finalLinkList
        .map(({ name, link }) => {
          const returnInfo = "<a class='footer-item' href='" + link + "' target='_blank' rel='noopener nofollow'>" + name + "</a>"
          return returnInfo;
        })
        .join("");
  
      html += "<a class='footer-item' href='/link/'>更多</a>";

      document.getElementById("friend-links-in-footer").innerHTML = html;

      setTimeout(()=>{
        footerRandomFriendsBtn.style.opacity = "1";
      }, 300)
    };