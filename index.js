
function Stage(seletor) {
  this.el = document.querySelector(seletor);
  this.picture = undefined;
  this.picLoaded = false;
}
Stage.prototype = {
  initImage(imgUrl, width, height) {
    this.picLoaded = false;
    this.picture = new Picture(imgUrl, width, height);
    this.picture.loaded(() => {
      this.picLoaded = true;
      // 删除原来的 canvas 元素
      const canvas = this.el.querySelector('canvas');
      canvas && canvas.remove();

      this.el.appendChild(this.picture.el);
      this.autofixPic()
    })
    
  },
  hasLoadPic() {
    return this.picLoaded;
  },
  // 让图片刚好填充舞台
  autofixPic(box) {
    if (!box) {
      box = {
        x: 0,
        y: 0,
        width: this.size().width,
        height: this.size().height,
        ratio: this.size().ratio
      }
    }
    console.log('图片自适应窗口')

    let scale = box.width / this.picture.getWidth();
    let height = this.picture.getHeight() * scale;
    if (height > box.height) scale = box.height / this.picture.getHeight()

    this.scaleImg(scale)
  },
  width() {
    const width = parseFloat(this.el.style.width);
    return width;
  },
  height() {
    const height = parseFloat(this.el.style.height);
    return height;
  },
  size(width, height) {
    if (width == undefined) {
      const width = parseFloat(this.el.style.width);
      const height = parseFloat(this.el.style.height);
      return {
        width,
        height,
        ratio: height / width
      }
    }
    this.el.style.width = width + 'px';
    this.el.style.height = height + 'px';
  },
  // 绑定事件
  enableMove() {
    let state = 'init';
    let pic_x, pic_y, old_x, old_y;
    window.addEventListener('mousedown', e => {
      if (e.target !== this.picture.el) return;

      e.preventDefault();
      state = 'down'
      pic_x = this.picture.x();
      pic_y = this.picture.y();
      old_x = e.pageX;
      old_y = e.pageY;
    });
    window.addEventListener('mousemove', e => {
      if (state === 'down') state = 'drag';
      if (state === 'drag') {
        // 拖拽 过程中执行的代码
        const dx = e.pageX - old_x;
        const dy = e.pageY - old_y;

        // 修正 x y 位置前，图片的盒模型
        const predictBox = {
          x: pic_x + dx,
          y: pic_y + dy,
          width: this.picture.getWidth(),
          height: this.picture.getHeight()
        }
        // 修正 x y 位置
        const {x, y} = this.fixImgPos(predictBox);
        this.picture.setPostion(x, y);
      }
    });
    window.addEventListener('mouseup', () => {
      state = 'init';
    });
  },
  scaleImg(scale) {
    const stage_width = this.width();
    const stage_height = this.height();

    this.picture.scaleInBox(
      scale, {
        stage_width, stage_height
      }
    )
  },
  scaleImgTo(scale) {
    const stage_width = this.width();
    const stage_height = this.height();

    this.picture.scaleToInBox(
      scale, {
        stage_width, stage_height
      }
    )
    console.log('当前图片缩放比：', this.picture.scale());
    // this.picture.scaleTo(scale);
  },
  rotateImg(angle) {
    this.picture.rotate(angle);
    this.autofixPic();
  },
  // 图片的 x， y 修正（尤其是缩小后，可能导致图片宽高大于 stage 的情况下，和stage之间仍有空白
  fixImgPos(box) {
    const stage_width = this.width();
    const stage_height = this.height(); 

    let new_x = box.x, 
        new_y = box.y;
    const min_x = stage_width - box.width,
          max_x = 0,
          min_y = stage_height - box.height,
          max_y = 0;

    if (box.width > stage_width) {
      if (box.x > max_x) new_x = max_x; // 缩放后，右边有空白
      else if (box.x < min_x) new_x = min_x; // 缩放后，左侧有空白
      else new_x = box.x;
    } else {
      new_x = (stage_width - box.width) / 2;
    }
    if (box.height > stage_height) {
      if (box.y > max_y) new_y = max_y;
      else if (box.y < min_y) new_y = min_y;
      else new_y = box.y;
    } else {
      new_y = (stage_height - box.height) / 2;
    }
    return {
      x: new_x,
      y: new_y
    }
  }
}

// 图片对象 (canvas 实现)
function Picture(imgUrl, width, height) {
  this.el = undefined;
  this.canvasCtx = undefined;
  this.img = undefined;
  this.loadedHandler = [];
  this.angle = 0;

  const img = new Image();
  this.el = document.createElement('canvas');
  this.canvasCtx = this.el.getContext('2d');
  this.img = img;
  img.src = imgUrl;
  img.onload = () => {
    console.log('图片加载完毕')
    this.el.width = img.width;
    this.el.height = img.height;
    this.canvasCtx.drawImage(img, 0, 0, img.width, img.height);

    if (width == undefined) {
      width = img.width;
      height = img.height;
    }
    this.setSize(width, height);
    this.setPostion(0, 0);
    
    this.loadedHandler.forEach(handler => handler());
  }
}
Picture.prototype = {
  loaded(cb) {
    this.loadedHandler.push(cb);
  },
  getWidth() {
    const width = parseFloat(this.el.style.width);
    return width;
  },
  getHeight() {
    const height = parseFloat(this.el.style.height);
    return height;
  },
  getRatio() {
    return this.getWidth() / this.getHeight();
  },
  originWidth(val) {
    if (val == undefined) {
      const width = this.el.width;
      return width;
    }
    this.el.width = val;
  },
  originHeight(val) {
    if (val == undefined) {
      const height = this.el.height;
      return height;
    }
    this.el.height = val;
  },
  setSize(width, height) {
    this.el.style.width = width + 'px';
    this.el.style.height = height + 'px';
  },
  // 缩放后
  boxAfterScale(scale, cx, cy) {
    if (cx == undefined) {
      cx = this.x() + this.getWidth() / 2;
      cy = this.y() + this.getHeight() / 2;
    }
    let width = this.getWidth();
    width *= scale;
    let height = this.getHeight();
    height *= scale;

    const x = cx - scale * (cx - this.x());
    const y = cy - scale * (cy - this.y());
    
    return {
      x, y, width, height
    };
  },
  // 根据给出图片 box 的范围和图片宽高和 stage 宽高，修正 x， y
  fixPos(box, stage_width, stage_height) {
    let new_x = box.x, 
        new_y = box.y;
    const min_x = stage_width - box.width,
          max_x = 0,
          min_y = stage_height - box.height,
          max_y = 0;

    if (box.width > stage_width) {
      if (box.x > max_x) new_x = max_x; // 缩放后，右边有空白
      else if (box.x < min_x) new_x = min_x; // 缩放后，左侧有空白
      else new_x = box.x;
    } else {
      new_x = (stage_width - box.width) / 2
    }
    if (box.height > stage_height) {
      if (box.y > max_y) new_y = max_y;
      else if (box.y < min_y) new_y = min_y;
      else new_y = box.y;
    } else {
      new_y = (stage_height - box.height) / 2
    }
    return {
      x: new_x,
      y: new_y
    }
  },
  // 特殊的缩放，缩放后要求图片和stage无空隙，除非宽或高小于stage。
  scaleInBox(scale, options) {
    let { cx, cy, stage_width, stage_height } = options;

    const box = this.boxAfterScale(scale); // 计算缩放后的盒子模型
    this.setSize(box.width, box.height);  // 宽高直接修改
    const {x, y} = this.fixPos(box, stage_width, stage_height); // 计算调整后的 x y。
    this.setPostion(x, y);  // 设置 x y
    this.setSize(box.width, box.height);
  },
  scaleToInBox(scale, option) {
    const current_scale = this.scale();
    const dscale = scale / current_scale;
    this.scaleInBox(dscale, option);
  },
  // 普通的缩放。
  scale(scale, cx, cy) {
    if (scale == undefined) {
      return this.getWidth() / this.originWidth();
    }
    if (cx == undefined) {
      cx = this.x() + this.getWidth() / 2;
      cy = this.y() + this.getHeight() / 2;
    }
    let width = this.getWidth();
    width *= scale;
    let height = this.getHeight();
    height *= scale;
    const new_x = cx - scale * (cx - this.x());
    const new_y = cy - scale * (cy - this.y());

    this.setSize(width, height);
    this.setPostion(new_x, new_y);
  },
  scaleTo(scale, cx, cy) {
    const current_scale = this.scale();
    const dscale = scale / current_scale;
    this.scale(dscale, cx, cy);
  },
  // 位置相关方法
  x(val) {
    if (val == undefined) {
      const x = parseFloat(this.el.style.left);
      return x;
    }
    this.el.style.left = val + 'px';
  },
  y(val) {
    if (val == undefined) {
      const y = parseFloat(this.el.style.top); 
      return y;
    }
    this.el.style.top = val + 'px';
  },
  setPostion(x, y) {
    this.x(x);
    this.y(y);
  },
  rotate(angle) {
    // 1. 重新绘制 img 到 canvas 上。
    this.angle = (this.angle + angle + 360) % 360;
    const img = this.img;
    // 交换图片宽高
    this.setSize(this.getHeight(), this.getWidth());
    [this.el.width, this.el.height] = [this.el.height, this.el.width];

    if (this.angle == 90) {
      this.canvasCtx.translate(img.height, 0);
    } else if (this.angle == 180) {
      this.canvasCtx.translate(img.width, img.height);
    } else if (this.angle == 270) {
      this.canvasCtx.translate(0, img.width);
    }

    this.canvasCtx.rotate(this.angle * Math.PI / 180);
    this.canvasCtx.drawImage(img, 0, 0, img.width, img.height);
  },
  center(cx, cy) {
    const x = cx - this.getWidth() / 2;
    const y = cy - this.getHeight() / 2;
    this.setPostion(x, y);
  },
}

const imgUrls = ['./img/pic.jpg', './img/square.jpg', 'https://image-cdn.xhvip100.com/test/5d9ea7cd519fb400011752fc.jpg']

const stage = new Stage('#stage');
stage.size(1030, 674);
stage.initImage(imgUrls[0]);
stage.enableMove();

document.querySelector('#scale-up').addEventListener('click', function() {
  // stage.scaleImg(1.2);
  const zoom = stage.picture.scale() + 0.1;
  stage.scaleImgTo(zoom);
})
document.querySelector('#scale-down').addEventListener('click', function() {
  // stage.scaleImg(0.8);
  const zoom = stage.picture.scale() - 0.1;
  stage.scaleImgTo(zoom);
})
document.querySelector('#rotate').addEventListener('click', function() {
  stage.rotateImg(90);
})
document.querySelector('#anti-rotate').addEventListener('click', function() {
  stage.rotateImg(-90);
})

let index = 0;
document.querySelector('#switchPic').addEventListener('click', function() {
  if (!stage.hasLoadPic()) {
    return console.warning('当前图片加载中，无法切换')
  }
  index = (index + 1) % imgUrls.length;
  const url = imgUrls[index];
  stage.initImage(url);
})