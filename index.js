
function Stage(seletor) {
  this.el = document.querySelector(seletor);
  this.picture = undefined;
}

Stage.prototype = {
  initImage(imgUrl, width, height) {
    // 创建一张图片
    this.picture = new Picture(imgUrl, width, height);
    this.el.appendChild(this.picture.el);
    this.scaleImg(0.5);
  },
  // 【未完成】让图片刚好填充舞台
  autofixPic() {
    let imgRatio = this.picture.getRatio();
    let stageRatio = this.size().ratio;
    if (stageRatio < imgRatio ) {
      // y 轴方向为基准
      
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
    this.picture.rotate(angle)
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

// 图片对象
function Picture(imgUrl, width, height) {
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
Picture.prototype = {
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
stage.initImage('./img/pic.jpg');
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