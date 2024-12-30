---
title: HTML2Canvas 踩坑实录：从问题到解决方案的最佳实践
date: 2024-01-03
description: 在前端开发中，HTML2Canvas 是一个强大的网页截图工具，但在实际使用过程中常常会遇到各种问题。本文将深入分析这些常见问题，从跨域处理到性能优化，从移动端适配到浏览器兼容性，为你提供完整的解决方案和最佳实践建议。
tags:
  - front-end
  - HTML2Canvas
  - performance
  - cross-origin
  - mobile
---

> 在做完各类证书、各类截图的需求后，回头看使用的html2canvas，觉得坑真的太多了，借此机会总结一下。
> 

## 目录

- getImageData() 或 toDataURL() 的跨域问题
- Maximum call stack size exceeded
- iOS15 failed to generate picture
- 一些另外的建议

## `getImageData()` 或 `toDataURL()` 的跨域问题

### 问题背景与现象

背景是这样的，母亲节的时候，我们有个需求就是用户可以长按或者点击一个按钮进行截图后去分享我们的活动，然而我们的图片例如头像，采用又拍云做 cdn 优化，所以意味着图片的链接跟主页面所在域名不一样，当需要需要对 canvas 图片进行 `getImageData()` 或 `toDataURL()` 操作的时候，跨域问题就出来了。

![跨域问题](https://tva1.sinaimg.cn/large/007S8ZIlgy1gexm4f3u0qj30to0c440z.jpg)

对于跨域的图片，只要能够在网页中正常显示出来，就可以使用 canvas 的 `drawImage()` API 绘制出来。但是如果你想更进一步，通过 `getImageData()` 方法获取图片的完整的像素信息，则多半会出错。

### 问题复现与分析

举例来说，使用下面代码获取 github 上的自己头像图片信息：

```jsx
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');

var img = new Image();
img.onload = function () {
    context.drawImage(this, 0, 0);
    context.getImageData(0, 0, this.width, this.height);
};
img.src = 'https://avatars.githubusercontent.com/u/38183707?v=4';
```

结果在 Chrome 浏览器下显示如下错误：

> Uncaught DOMException: Failed to execute 'getImageData' on 'CanvasRenderingContext2D': The canvas has been tainted by cross-origin data.
> 

![Chrome跨域问题](https://tva1.sinaimg.cn/large/007S8ZIlgy1gewv5y3gq6j30bf01edfn.jpg)

Firefox 浏览器错误为：

> SecurityError: The operation is insecure.
> 

如果使用的是 canvas.toDataURL()方法，则会报：

> Failed to execute 'toDataURL' on　'HTMLCanvasElement': Tainted canvased may not be exported
> 

原因其实都是一样的，跨域导致。

### 解决方案

#### 1. HTML crossOrigin 属性解决资源跨域问题

在 HTML5 中，有些元素提供了支持 CORS(Cross-Origin Resource Sharing)（跨域资源共享）的属性，这些元素包括`img` 等，而提供的属性名就是 `crossOrigin` 属性。

因此，上面的跨域问题可以这么处理：

```jsx
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');

var img = new Image();
img.crossOrigin = '';
img.onload = function () {
    context.drawImage(this, 0, 0);
    context.getImageData(0, 0, this.width, this.height);
};
img.src = 'https://avatars.githubusercontent.com/u/38183707?v=4';
```

增加一个 `img.crossOrigin = ''` 即可，虽然 JS 代码这里设置的是空字符串，实际上起作用的属性值是 `anonymous`。

`crossOrigin` 可以有下面两个值：

| 关键字 | 释义 |
| --- | --- |
| anonymous | 元素的跨域资源请求不需要凭证标志设置。 |
| use-credentials | 元素的跨域资源请求需要凭证标志设置，意味着该请求需要提供凭证。 |

其中，只要 `crossOrigin` 的属性值不是 `use-credentials`，全部都会解析为 `anonymous`，包括空字符串，包括类似 `'abc'` 这样的字符。

例如：

```jsx
img.crossOrigin = 'abc';
console.log(img.crossOrigin);    // 结果是'anonymous'
```

![crossOrigin属性](https://tva1.sinaimg.cn/large/007S8ZIlgy1gexl91oqq5j307h0380sj.jpg)

另外还有一点需要注意，那就是虽然没有 `crossOrigin` 属性，和设置 `crossOrigin="use-credentials"` 在默认情况下都会报跨域出错，但是性质上却不一样，两者有较大区别。

**crossOrigin 兼容性**

IE11+(IE Edge)，Safari，Chrome，Firefox 浏览器均支持，IE9 和 IE10 会报 SecurityError 安全错误，如下截图：

![crossOrigin兼容性](https://tva1.sinaimg.cn/large/007S8ZIlgy1gexl92lez6j309w02wq2r.jpg)

crossOrigin 属性为什么可以解决资源跨域问题？

`crossOrigin=anonymous` 相对于告诉对方服务器，你不需要带任何非匿名信息过来。例如 cookie，因此，当前浏览器肯定是安全的。

就好比你要去别人家里拿一件衣服，`crossOrigin=anonymous` 相对于告诉对方，我只要衣服，其他都不要。如果不说，可能对方在衣服里放个窃听的工具什么的，就不安全了，浏览器就会阻止。

#### 2. 下载到本地

IE10 浏览器不支持 crossOrigin 怎么办？

我们请求图片的时候，不是直接通过 `new Image()`，而是借助 ajax 和 `URL.createObjectURL()` 方法曲线救国。

代码如下：

```jsx
var xhr = new XMLHttpRequest();
xhr.onload = function () {
    var url = URL.createObjectURL(this.response);
    var img = new Image();
    img.onload = function () {
        // 此时你就可以使用canvas对img为所欲为了
        // ... code ...
        // 图片用完后记得释放内存
        URL.revokeObjectURL(url);
    };
    img.src = url;
};
xhr.open('GET', url, true);
xhr.responseType = 'blob';
xhr.send();
```

此方法不仅 IE10 浏览器 OK，原本支持 crossOrigin 的诸位浏览器也是支持的。

也就多走一个 ajax 请求，还可以！

根据，根据实践发现，在 IE 浏览器下，如果请求的图片过大，几千像素那种，图片会加载失败，我猜是超过了 blob 尺寸限制。

后来采用的解决方案是：把图片下载到本地（前端或者是后端都可以，最后采用我前端来做）

```jsx
 const getAvator = (user, func) => {
      window.URL = window.URL || window.webkitURL;  // Take care of vendor prefixes.
      var xhr = new XMLHttpRequest();
      xhr.open('GET', user.avatar, true);
      xhr.responseType = 'blob';
      xhr.send()

      xhr.onload = function(e) {
        const {target} = e
        const {status, response, readyState} = target
        if (readyState == 4 && status == 200) {
          var blob = response;
          var img = document.createElement('img');
          img.classList.add("avatar")
          var reader = new window.FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = function() {
            var base64data = reader.result;
            img.src = base64data;
          };
          func && func(img)
        }
      };
    },
```

#### 3. 设置 nginx 代理

如 PHP 添加响应头信息，`*` 通配符表示允许任意域名：

```lua
header("Access-Control-Allow-Origin: *");
```

或者指定域名：

```lua
header("Access-Control-Allow-Origin: www.zhangxinxu.com");
```

## Maximum call stack size exceeded

### 问题描述

这个是出现ios 跟 M1芯片的Mac（Arm架构）

https://github.com/niklasvh/html2canvas/issues/2539

### 解决方案

所以解决方法是在package.json和scripts/fix-html2canvans.ts中新增以下

```json
{
	"script": {
		"postinstall": "npm run fix",
    "fix": "esno scripts/fix-html2canvans.ts",
	}
}
```

```jsx
// scripts/fix-html2canvans.ts
import path from 'path';
import fs from 'fs';

const pkgDir = path.join(__dirname, '..');

{
  const p = path.join(pkgDir, 'node_modules/html2canvas/dist/html2canvas.js');
  if (fs.existsSync(p)) {
    let txt = fs.readFileSync(p, { encoding: 'utf8' });

    txt = txt.replace('var SLICE_STACK_SIZE = 60000;', 'var SLICE_STACK_SIZE = 50000;');

    fs.writeFileSync(p, txt, { encoding: 'utf8' });
  }
}
```

## **iOS15 failed to generate picture**

### 问题描述

在iOS 15系统上出现生成图片失败的问题：
https://github.com/niklasvh/html2canvas/issues/2633

### 解决方案

所以解决方法是

```css
/* 这里设置font-family是为了解决html2canvas在ios15系统下画图崩溃的问题，详情看 https://github.com/niklasvh/html2canvas/issues/2633 */
#app {
  font-family: PingFang SC, Source Han Sans CN, Hiragino Sans GB, Heiti SC, STXihei, Microsoft YaHei,
    SimHei;
}
```

## 最佳实践与优化建议

1. **数据预处理**：如果使用 vue 做数据渲染，不要在生成页做太多数据处理的操作，提前把动态数据处理好，譬如要等图片加载完，否则即便用 $nextTick 也会有在生成图片时数据不完整的情况。

2. **图片资源处理**：
   - 引用 CDN 上的图片，需要设置 useCORS 为 true
   - 确保所有图片加载完成后再生成
   - 可使用 new Image 做预加载（css background）
   - 监控图片加载状态，等所有图片加载完成后再截图

3. **图片质量优化**：
   - 避免使用背景 background，会导致生成的图片清晰度不够，模糊
   - 推荐使用 img 标签引入图片
   - 合理设置图片尺寸和压缩比例

4. **版本选择**：
   - 在 iOS 系统的 13.4.1，需要使用 1.0.0-rc.4 版本
   - 避免使用 1.0.0-rc.5 版本
   - 推荐使用：
     - 1.0.0-rc.4 版本
     - 1.0.0-rc.7 版本
     - @jomsou/html2canvas@1.0.0-rc.4（修复了栈溢出问题）

5. **用户体验优化**：
   - 可把生成的图片设置透明度 opacity 为 0
   - 将生成的图片盖在原有元素之上
   - 这样在微信保存时不会因为生成的图和原有元素略微有差距而抖动

<ArticleFooter />