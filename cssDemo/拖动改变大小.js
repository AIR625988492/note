// 拖拽的方法 整个方法绑定到可以拖动的元素上
// 在这里我放到了 devtool-network-info的子元素<hr>中
// 所以就监听了hr的 onMouseDown = networkInfoDragStart
networkInfoDragStart(tabId: string, event: MouseEvent) {
    const _this = this;
    const networkInfo = document.getElementById('devtool-network-info' + tabId);// 找到这个父元素
    let startX = event.clientX;  // 获取按下 hr的当前坐标
    if (!_this.stateTabdata[tabId].nwHorizontals) { // 默认要放大或者缩小的元素宽
      this.stateTabdata[tabId].nwHorizontals = document.body.clientWidth * 0.01 * 42;
    }
    let width = 0; // 要放大或缩小的元素宽度
    document.onmousemove = (ev: MouseEvent) => {
      if (ev.stopPropagation) {
        ev.stopPropagation();
      } else {
        ev.cancelBubble = true;
      }
      // 当前宽度-（ 当前x 减去起始位置即移动距离） 为放大或缩小的宽度
      width =this.stateTabdata[tabId].nwHorizontals-
         (ev.clientX - startX);
      networkInfo.style.width = width + 'px';
      _this.$forceUpdate();
      return false;
    }

    document.onmouseup = (ev: MouseEvent) => {
      document.onmousemove = null;
      document.onmouseup = null;
      // 鼠标抬起后改变为当前的宽度
      this.stateTabdata[tabId].nwHorizontals = width;
      ev.stopPropagation();
      return false;
    }
    document.onmouseleave = (ev: MouseEvent) => {
      document.onmousemove = null;
      document.onmouseup = null;
      // 鼠标离开后改变为当前的宽度
      this.stateTabdata[tabId].nwHorizontals = width;
      ev.stopPropagation();
      return false;
    }
    return false;
  }
