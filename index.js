
function Stage(seletor) {
  this.el = document.querySelector(seletor);
  this.picture = undefined;
}

Stage.prototype = {
  initImage(imgUrl, width, height) {
    // 创建一张图片
    this.picture = new Picture(imgUrl, width, height);
    this.picture.loaded(() => {
      this.el.appendChild(this.picture.el);
      // this.scaleImg(0.5);
      this.autofixPic()
    })
    
  },
  // 【未完成】让图片刚好填充舞台
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

    const imgRatio = this.picture.getRatio();
    console.log('自适应')

    if (imgRatio > box.ratio) {
      // 图片高设置为 stage 高。
      const scale = box.width / this.picture.getWidth();
      // this.picture.setSize(, box.width);
      this.scaleImg(scale)
    } else {
      // x
      const scale = box.height / this.picture.getHeight();
      this.scaleImg(scale)
    }
    
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
      console.log('按下')
      state = 'down'
      pic_x = this.picture.x();
      pic_y = this.picture.y();
      old_x = e.pageX;
      old_y = e.pageY;
    });
    window.addEventListener('mousemove', e => {
      if (state === 'down') state = 'drag';
      if (state == 'drag') {
        console.log('拖拽')
        const dx = e.pageX - old_x;
        const dy = e.pageY - old_y;

        // 修正位置前，图片的盒模型
        const predictBox = {
          x: pic_x + dx,
          y: pic_y + dy,
          width: this.picture.getWidth(),
          height: this.picture.getHeight()
        }
        const {x, y} = this.fixImgPos(predictBox);
        this.picture.setPostion(x, y);
      }
    });
    window.addEventListener('mouseup', () => {
      state = 'init';
      console.log('释放')
    });
    // window.addEventListener('mousewheel', () => {

    // })
  },
  scaleImg(scale) {
    // 计算缩放后的图片x, y，在必要时进行调整。
    const box = this.picture.boxAfterScale(scale);

    this.picture.setSize(box.width, box.height);

    const {x, y} = this.fixImgPos(box);
    this.picture.setPostion(x, y); 
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
  }
}

// 图片对象 (canvas 实现)
function Picture(imgUrl, width, height) {
  const img = new Image();
  this.el = document.createElement('canvas');
  this.canvasCtx = this.el.getContext('2d');
  this.img = img;
  this.loadedHandler = [];
  this.angle = 0;

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
  // if (width == undefined) {
  //   width = img.width;
  //   height = img.height;
  // }
  // this.setSize(width, height);
  // this.setPostion(0, 0);
}
Picture.prototype = {
  loaded(cb) {
    this.loadedHandler.push(cb);
  },
  // 尺寸相关方法
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
  setSize(width, height) {
    this.el.style.width = width + 'px';
    this.el.style.height = height + 'px';
    // this.canvasCtx.drawImage(this.img, 0, 0, width, height)
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
  scale(scale, cx, cy) {
    if (cx == undefined) {
      cx = this.x() + this.getWidth() / 2;
      cy = this.y() + this.getHeight() / 2;
    }
    let width = this.getWidth();
    width *= scale;
    let height = this.getHeight();
    height *= scale;
    this.setSize(width, height);

    const new_x = cx - scale * (cx - this.x());
    const new_y = cy - scale * (cy - this.y());
    this.setPostion(new_x, new_y);
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
    // 旋转这里要修改实现。。
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


// 图片对象
function Picture2(imgUrl, width, height) {
  const img = new Image();
  img.src = imgUrl;
  this.el = img;
  // img.style.width = img.width + 'px';
  // img.style.height = img.height + 'px';
  if (width == undefined) {
    width = img.width;
    height = img.height;
  }
  this.setSize(width, height);
  this.setPostion(0, 0);
}
Picture2.prototype = {
  // 尺寸相关方法
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
  scale(scale, cx, cy) {
    if (cx == undefined) {
      cx = this.x() + this.getWidth() / 2;
      cy = this.y() + this.getHeight() / 2;
    }
    let width = this.getWidth();
    width *= scale;
    let height = this.getHeight();
    height *= scale;
    this.setSize(width, height);

    const new_x = cx - scale * (cx - this.x());
    const new_y = cy - scale * (cy - this.y());
    this.setPostion(new_x, new_y);
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
    const transfrom = this.el.style.transform;
    if (angle == undefined) {
      const match = /-?\d+/.exec(transfrom);
      if (!match) return 0;
      return parseFloat(match[0]);
    }
    const oldR = this.rotate();
    this.el.style.transform = `rotate(${(oldR + angle) % 360}deg)`;
  },
  center(cx, cy) {
    const x = cx - this.getWidth() / 2;
    const y = cy - this.getHeight() / 2;
    this.setPostion(x, y);
  }
}


const stage = new Stage('#stage');
stage.size(700, 500);
stage.initImage('./img/pic.jpg', 1280, 720)
stage.enableMove();

document.querySelector('#scale-up').addEventListener('click', function() {
  stage.scaleImg(1.2);
})
document.querySelector('#scale-down').addEventListener('click', function() {
  stage.scaleImg(0.8);
})
document.querySelector('#rotate').addEventListener('click', function() {
  stage.rotateImg(90);
})
document.querySelector('#anti-rotate').addEventListener('click', function() {
  stage.rotateImg(-90);
})